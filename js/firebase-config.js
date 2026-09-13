// Firebase Configuration and Database Service
// Supports both Real Firebase Firestore (Modular v10 SDK) and high-fidelity LocalStorage fallback

(function () {
  // Default placeholder config - users can edit this here or via the in-app "Firebase Settings" modal
  window.DEFAULT_FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  const STORAGE_KEY_CONFIG = 'buet_eval_firebase_config';
  const STORAGE_KEY_TEACHERS = 'buet_eval_teachers_v2';
  const STORAGE_KEY_REVIEWS = 'buet_eval_reviews_v2';

  class DatabaseService {
    constructor() {
      this.isFirebaseActive = false;
      this.db = null;
      this.listeners = [];
      this.loadConfig();
    }

    loadConfig() {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        try {
          this.config = JSON.parse(saved);
        } catch (e) {
          this.config = { ...window.DEFAULT_FIREBASE_CONFIG };
        }
      } else {
        this.config = { ...window.DEFAULT_FIREBASE_CONFIG };
      }
    }

    saveConfig(newConfig) {
      this.config = { ...newConfig };
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
      return this.initFirebase();
    }

    hasValidConfig() {
      return !!(
        this.config &&
        this.config.apiKey &&
        this.config.apiKey.length > 10 &&
        this.config.projectId &&
        this.config.projectId.length > 2
      );
    }

    async initFirebase() {
      if (!this.hasValidConfig()) {
        this.isFirebaseActive = false;
        this.notifyStatusChange('local');
        return { success: false, mode: 'local', message: 'Using Local Storage mode (No Firebase keys entered).' };
      }

      try {
        // Dynamically load Firebase modules if not already loaded
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const {
          getFirestore, collection, getDocs, doc, setDoc, addDoc, getDoc, updateDoc, serverTimestamp, query, where, orderBy
        } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        let app;
        const currentApps = getApps();
        if (currentApps.length > 0) {
          app = currentApps[0];
        } else {
          app = initializeApp(this.config);
        }

        this.db = getFirestore(app);
        this.firestoreOps = { collection, getDocs, doc, setDoc, addDoc, getDoc, updateDoc, serverTimestamp, query, where, orderBy };
        this.isFirebaseActive = true;
        this.notifyStatusChange('connected');
        return { success: true, mode: 'firebase', message: 'Successfully connected to Firebase Firestore!' };
      } catch (err) {
        console.warn('Firebase init failed, reverting to local mode:', err);
        this.isFirebaseActive = false;
        this.notifyStatusChange('error', err.message);
        return { success: false, mode: 'error', message: err.message };
      }
    }

    onStatusChange(callback) {
      this.listeners.push(callback);
    }

    notifyStatusChange(status, error = null) {
      this.listeners.forEach(cb => cb(status, error));
    }

    // LocalStorage helper: initialize teachers if missing
    getLocalTeachers() {
      const stored = localStorage.getItem(STORAGE_KEY_TEACHERS);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {}
      }
      const initial = (window.INITIAL_TEACHERS || []).map(t => ({ ...t }));
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initial));
      return initial;
    }

    saveLocalTeachers(teachers) {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    }

    // Public API: Fetch all teachers
    async getTeachers() {
      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          const colRef = collection(this.db, 'teachers');
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            return list;
          } else {
            // First time on Firestore: seed from INITIAL_TEACHERS
            const initial = this.getLocalTeachers();
            await this.seedFirestore(initial);
            return initial;
          }
        } catch (e) {
          console.warn('Failed to fetch from Firestore, using local fallback:', e);
          return this.getLocalTeachers();
        }
      }
      return this.getLocalTeachers();
    }

    async seedFirestore(teachersList) {
      if (!this.isFirebaseActive || !this.db) return;
      try {
        const { collection, doc, setDoc } = this.firestoreOps;
        const colRef = collection(this.db, 'teachers');
        // Seed first 40 teachers with ratings to keep Firestore writes modest
        const seedBatch = teachersList.slice(0, 50);
        for (const t of seedBatch) {
          await setDoc(doc(colRef, t.id), t);
        }
        console.log('Seeded initial teachers to Firestore.');
      } catch (e) {
        console.warn('Seed to Firestore error:', e);
      }
    }

    // Public API: Add a review
    async addReview(teacherId, reviewData) {
      const review = {
        id: 'rev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        teacherId,
        author: reviewData.author || window.getRandomAnonymousName(),
        date: new Date().toISOString().split('T')[0],
        course: reviewData.course || 'General',
        greenStars: Number(reviewData.greenStars || 0),
        redStars: Number(reviewData.redStars || 0),
        tags: reviewData.tags || [],
        comment: reviewData.comment || '',
        timestamp: Date.now()
      };

      // 1. Update in local storage
      const teachers = this.getLocalTeachers();
      const teacher = teachers.find(t => t.id === teacherId);
      if (teacher) {
        if (!teacher.reviews) teacher.reviews = [];
        teacher.reviews.unshift(review);

        // Recalculate metrics
        this.recalculateTeacherStats(teacher);
        this.saveLocalTeachers(teachers);
      }

      // 2. If Firebase is active, persist to Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, addDoc, doc, setDoc, updateDoc } = this.firestoreOps;
          await addDoc(collection(this.db, 'reviews'), review);
          if (teacher) {
            await setDoc(doc(this.db, 'teachers', teacherId), teacher, { merge: true });
          }
        } catch (e) {
          console.error('Failed to write review to Firestore:', e);
        }
      }

      return { success: true, review, teacher };
    }

    // Public API: Add a new teacher
    async addTeacher(teacherData) {
      const deptCode = teacherData.deptCode || 'OTHER';
      const count = (this.getLocalTeachers() || []).length + 1;
      const newTeacher = {
        id: `${deptCode.toLowerCase()}-${String(count).padStart(3, '0')}`,
        name: teacherData.name.trim(),
        dept: teacherData.dept.trim(),
        deptCode: deptCode.toUpperCase(),
        designation: teacherData.designation || 'Lecturer',
        location: teacherData.location || 'BUET Campus',
        avatarColor: '#3B82F6',
        stats: {
          greenStars: 0,
          redStars: 0,
          totalReviews: 0,
          greenPoints: 0,
          redPoints: 0,
          netApproval: 50
        },
        reviews: []
      };

      const teachers = this.getLocalTeachers();
      teachers.unshift(newTeacher);
      this.saveLocalTeachers(teachers);

      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, setDoc } = this.firestoreOps;
          await setDoc(doc(this.db, 'teachers', newTeacher.id), newTeacher);
        } catch (e) {
          console.warn('Failed to add teacher to Firestore:', e);
        }
      }

      return newTeacher;
    }

    // Rating calculation algorithm
    recalculateTeacherStats(teacher) {
      const reviews = teacher.reviews || [];
      const total = reviews.length;
      if (total === 0) {
        teacher.stats = {
          greenStars: 0,
          redStars: 0,
          totalReviews: 0,
          greenPoints: 0,
          redPoints: 0,
          netApproval: 50
        };
        return;
      }

      let totalGreen = 0;
      let totalRed = 0;
      for (const r of reviews) {
        totalGreen += Number(r.greenStars || 0);
        totalRed += Number(r.redStars || 0);
      }

      const greenAvg = +(totalGreen / total).toFixed(1);
      const redAvg = +(totalRed / total).toFixed(1);
      const net = Math.round((totalGreen / (totalGreen + totalRed + 1e-5)) * 100);

      teacher.stats = {
        greenStars: greenAvg,
        redStars: redAvg,
        totalReviews: total,
        greenPoints: totalGreen,
        redPoints: totalRed,
        netApproval: Math.min(100, Math.max(0, net))
      };
    }
  }

  window.dbService = new DatabaseService();
})();
