// Firebase Configuration and Database Service
// Clean architecture: Never seeds mock/dummy reviews into Firebase.
// If the database is empty, zero reviews are displayed.

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
  const STORAGE_KEY_TEACHERS = 'buet_eval_teachers_clean_v1';

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

    // LocalStorage helper: initialize clean teachers directory with 0 reviews
    getLocalTeachers() {
      const stored = localStorage.getItem(STORAGE_KEY_TEACHERS);
      if (stored) {
        try {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            return list;
          }
        } catch (e) {}
      }
      const initial = (window.INITIAL_TEACHERS || []).map(t => ({
        ...t,
        stats: {
          greenStars: 0,
          redStars: 0,
          totalReviews: 0,
          greenPoints: 0,
          redPoints: 0,
          netApproval: 0
        },
        reviews: []
      }));
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(initial));
      return initial;
    }

    saveLocalTeachers(teachers) {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    }

    // Public API: Fetch all teachers
    // Never seeds mock data. If the database is empty, returns teachers with 0 reviews.
    async getTeachers() {
      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          
          // Base faculty directory with clean 0-review states
          const baseTeachers = (window.INITIAL_TEACHERS || []).map(t => ({
            ...t,
            stats: {
              greenStars: 0,
              redStars: 0,
              totalReviews: 0,
              greenPoints: 0,
              redPoints: 0,
              netApproval: 0
            },
            reviews: []
          }));

          const teacherMap = new Map();
          baseTeachers.forEach(t => teacherMap.set(t.id, t));

          // Fetch custom added teachers from Firestore (if any were added via 'Add Teacher')
          const teachersSnap = await getDocs(collection(this.db, 'teachers'));
          teachersSnap.forEach(d => {
            const data = d.data();
            const existing = teacherMap.get(d.id);
            if (existing) {
              Object.assign(existing, data);
              existing.reviews = existing.reviews || [];
            } else {
              teacherMap.set(d.id, {
                id: d.id,
                ...data,
                reviews: data.reviews || [],
                stats: data.stats || {
                  greenStars: 0,
                  redStars: 0,
                  totalReviews: 0,
                  greenPoints: 0,
                  redPoints: 0,
                  netApproval: 0
                }
              });
            }
          });

          // Fetch genuine student reviews from Firestore
          const reviewsSnap = await getDocs(collection(this.db, 'reviews'));
          if (!reviewsSnap.empty) {
            // Reset reviews array before populating from Firestore
            teacherMap.forEach(t => { t.reviews = []; });
            reviewsSnap.forEach(rDoc => {
              const rev = rDoc.data();
              const teacherId = rev.teacherId;
              const teacher = teacherMap.get(teacherId);
              if (teacher) {
                teacher.reviews.push({ id: rDoc.id, ...rev });
              }
            });

            // Recalculate stats for each teacher based only on actual reviews
            teacherMap.forEach(t => {
              this.recalculateTeacherStats(t);
            });
          }

          return Array.from(teacherMap.values());
        } catch (e) {
          console.warn('Failed to fetch from Firestore, using clean local fallback:', e);
          return this.getLocalTeachers();
        }
      }

      return this.getLocalTeachers();
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
      let teacher = teachers.find(t => t.id === teacherId);
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
          const { collection, addDoc, doc, setDoc } = this.firestoreOps;
          await addDoc(collection(this.db, 'reviews'), review);
          if (teacher) {
            await setDoc(doc(this.db, 'teachers', teacherId), {
              id: teacher.id,
              name: teacher.name,
              dept: teacher.dept,
              deptCode: teacher.deptCode,
              designation: teacher.designation,
              stats: teacher.stats
            }, { merge: true });
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
          netApproval: 0
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

    // Rating calculation algorithm based strictly on actual student reviews
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
          netApproval: 0
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
