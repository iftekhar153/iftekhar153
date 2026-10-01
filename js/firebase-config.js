// Firebase Configuration and Database Service
// Integrated with user's megamindratings project + resilient LocalStorage fallback
// Supports Admin modifications (Teachers, Verification Questions, Settings)

(function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDQUWu0V9b55-Kg8wi3QMfm404ZguMPdwA",
    authDomain: "megamindratings.firebaseapp.com",
    projectId: "megamindratings",
    storageBucket: "megamindratings.firebasestorage.app",
    messagingSenderId: "343564257626",
    appId: "1:343564257626:web:8ae672e7d5e44ea2458b63"
  };

  const STORAGE_KEY_CUSTOM_TEACHERS = 'buet_custom_teachers_v1';
  const STORAGE_KEY_CUSTOM_QUESTIONS = 'buet_custom_questions_v1';
  const STORAGE_KEY_SETTINGS = 'buet_portal_settings_v1';
  const STORAGE_KEY_LOCAL_REVIEWS = 'buet_eval_reviews_v2';

  class DatabaseService {
    constructor() {
      this.isFirebaseActive = false;
      this.db = null;
      this.firestoreOps = null;
      this.config = FIREBASE_CONFIG;
      this.connectionStatus = 'initializing'; // 'online', 'offline', 'error'
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
        this.connectionStatus = 'offline';
        this.notifyStatus();
        return { success: false, mode: 'local' };
      }

      try {
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const {
          getFirestore, collection, getDocs, doc, setDoc, getDoc, addDoc, deleteDoc
        } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        let app;
        const currentApps = getApps();
        if (currentApps.length > 0) {
          app = currentApps[0];
        } else {
          app = initializeApp(this.config);
        }

        this.db = getFirestore(app);
        this.firestoreOps = { collection, getDocs, doc, setDoc, getDoc, addDoc, deleteDoc };
        this.isFirebaseActive = true;
        this.connectionStatus = 'online';
        this.notifyStatus();
        console.log('Connected to Google Firebase Firestore (megamindratings).');
        return { success: true, mode: 'firebase' };
      } catch (err) {
        console.warn('Firebase init error, continuing in local mode:', err);
        this.isFirebaseActive = false;
        this.connectionStatus = 'offline';
        this.notifyStatus();
        return { success: false, mode: 'local', error: err.message };
      }
    }

    notifyStatus() {
      window.dispatchEvent(new CustomEvent('buet-db-status', {
        detail: {
          online: this.isFirebaseActive,
          status: this.connectionStatus
        }
      }));
    }

    getLocalReviews() {
      try {
        const data = localStorage.getItem(STORAGE_KEY_LOCAL_REVIEWS);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }

    saveLocalReviews(reviews) {
      try {
        localStorage.setItem(STORAGE_KEY_LOCAL_REVIEWS, JSON.stringify(reviews));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
    }

    // =========================================================================
    // TEACHERS API (Base directory + Admin modifications)
    // =========================================================================

    // Returns all teachers with their calculated stats and review list
    async getTeachers() {
      // 1. Base directory (277 verified BUET faculty records)
      const baseTeachers = (window.INITIAL_TEACHERS || []).map(t => ({
        ...t,
        stats: {
          avgScore: 0.0,
          yellowStars: 0,
          redStars: 0,
          zeroStars: 0,
          totalReviews: 0,
          netScore: 0
        },
        reviews: []
      }));

      const teacherMap = new Map();
      baseTeachers.forEach(t => teacherMap.set(t.id, t));

      // 2. Fetch custom/modified teachers from Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          const teachersSnap = await getDocs(collection(this.db, 'teachers'));
          teachersSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.deleted) {
              teacherMap.delete(docSnap.id);
            } else if (teacherMap.has(docSnap.id)) {
              const existing = teacherMap.get(docSnap.id);
              Object.assign(existing, data);
            } else {
              teacherMap.set(docSnap.id, {
                ...data,
                id: docSnap.id,
                stats: {
                  avgScore: 0.0,
                  yellowStars: 0,
                  redStars: 0,
                  zeroStars: 0,
                  totalReviews: 0,
                  netScore: 0
                },
                reviews: []
              });
            }
          });
        } catch (e) {
          console.warn('Could not read teachers collection from Firestore:', e);
        }
      }

      // Merge local custom/modified teachers from localStorage fallback
      try {
        const localCustom = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_TEACHERS) || '{}');
        Object.keys(localCustom).forEach(id => {
          const data = localCustom[id];
          if (data.deleted) {
            teacherMap.delete(id);
          } else if (teacherMap.has(id)) {
            Object.assign(teacherMap.get(id), data);
          } else {
            teacherMap.set(id, {
              ...data,
              id: id,
              stats: { avgScore: 0, yellowStars: 0, redStars: 0, zeroStars: 0, totalReviews: 0, netScore: 0 },
              reviews: []
            });
          }
        });
      } catch (e) { }

      // 3. Fetch reviews from Firestore
      let allReviews = [];

      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          const reviewsSnap = await getDocs(collection(this.db, 'reviews'));
          reviewsSnap.forEach(docSnap => {
            const rData = docSnap.data();
            allReviews.push({
              ...rData,
              firestoreDocId: docSnap.id,
              id: rData.id || docSnap.id
            });
          });
        } catch (e) {
          console.warn('Could not read from Firestore, falling back to local reviews:', e);
        }
      }

      // Merge local reviews (avoid duplicates by ID)
      const localReviews = this.getLocalReviews();
      const existingIds = new Set(allReviews.map(r => r.id));
      for (const lr of localReviews) {
        if (!existingIds.has(lr.id)) {
          allReviews.push(lr);
        }
      }

      // 4. Attach reviews to respective teachers
      allReviews.forEach(rev => {
        const teacher = teacherMap.get(rev.teacherId);
        if (teacher) {
          teacher.reviews.push(rev);
        }
      });

      // 5. Calculate metrics for each teacher based on user ratings (+5 to -5)
      teacherMap.forEach(t => {
        this.calculateTeacherMetrics(t);
      });

      return Array.from(teacherMap.values());
    }

    calculateTeacherMetrics(teacher) {
      const reviews = teacher.reviews || [];
      const total = reviews.length;
      if (total === 0) {
        teacher.stats = {
          avgScore: 0.0,
          yellowStars: 0,
          redStars: 0,
          zeroStars: 0,
          totalReviews: 0,
          netScore: 0
        };
        return;
      }

      // Sort reviews newest first
      reviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      let netScore = 0;
      let yellowCount = 0;
      let redCount = 0;
      let zeroCount = 0;

      for (const r of reviews) {
        const score = Number(r.score || 0);
        netScore += score;
        if (score > 0) yellowCount++;
        else if (score < 0) redCount++;
        else zeroCount++;
      }

      const avg = +(netScore / total).toFixed(1);

      teacher.stats = {
        avgScore: avg,
        yellowStars: yellowCount,
        redStars: redCount,
        zeroStars: zeroCount,
        totalReviews: total,
        netScore: netScore
      };
    }

    // Save or update teacher (Admin)
    async saveTeacher(teacherData) {
      const id = teacherData.id || `${(teacherData.deptCode || 'GEN').toLowerCase()}-${Date.now().toString(36)}`;
      const cleanData = {
        id,
        name: (teacherData.name || '').trim(),
        dept: (teacherData.dept || '').trim(),
        deptCode: (teacherData.deptCode || 'CSE').trim().toUpperCase(),
        designation: (teacherData.designation || 'Lecturer').trim(),
        location: (teacherData.location || 'BUET Campus').trim(),
        updatedAt: Date.now()
      };

      // Save locally
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_TEACHERS) || '{}');
        local[id] = cleanData;
        localStorage.setItem(STORAGE_KEY_CUSTOM_TEACHERS, JSON.stringify(local));
      } catch (e) { }

      // Save to Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, setDoc } = this.firestoreOps;
          await setDoc(doc(this.db, 'teachers', id), cleanData, { merge: true });
        } catch (e) {
          console.warn('Failed to save teacher to Firestore:', e);
        }
      }

      return cleanData;
    }

    // Delete teacher (Admin)
    async deleteTeacher(teacherId) {
      // Local
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_TEACHERS) || '{}');
        local[teacherId] = { deleted: true };
        localStorage.setItem(STORAGE_KEY_CUSTOM_TEACHERS, JSON.stringify(local));
      } catch (e) { }

      // Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, setDoc } = this.firestoreOps;
          await setDoc(doc(this.db, 'teachers', teacherId), { deleted: true }, { merge: true });
        } catch (e) {
          console.warn('Failed to mark teacher deleted in Firestore:', e);
        }
      }

      return true;
    }

    // =========================================================================
    // VERIFICATION QUESTIONS API (Base questions + Admin modifications)
    // =========================================================================

    async getQuestions() {
      // Deep clone default questions
      const base = JSON.parse(JSON.stringify(window.DEPARTMENT_QUESTIONS || {}));

      // Fetch custom/edited questions from Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          const snap = await getDocs(collection(this.db, 'questions'));
          snap.forEach(docSnap => {
            const data = docSnap.data();
            const dept = data.dept || 'CSE';
            if (!base[dept]) base[dept] = [];

            if (data.deleted) {
              base[dept] = base[dept].filter(q => q.id !== docSnap.id);
            } else {
              const existingIdx = base[dept].findIndex(q => q.id === docSnap.id);
              if (existingIdx >= 0) {
                base[dept][existingIdx] = { ...data, id: docSnap.id };
              } else {
                base[dept].push({ ...data, id: docSnap.id });
              }
            }
          });
        } catch (e) {
          console.warn('Could not read questions from Firestore:', e);
        }
      }

      // Merge local custom questions
      try {
        const localQuestions = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS) || '{}');
        Object.keys(localQuestions).forEach(id => {
          const data = localQuestions[id];
          const dept = data.dept || 'CSE';
          if (!base[dept]) base[dept] = [];

          if (data.deleted) {
            base[dept] = base[dept].filter(q => q.id !== id);
          } else {
            const existingIdx = base[dept].findIndex(q => q.id === id);
            if (existingIdx >= 0) {
              base[dept][existingIdx] = { ...data, id };
            } else {
              base[dept].push({ ...data, id });
            }
          }
        });
      } catch (e) { }

      return base;
    }

    async getQuestionsForDept(dept) {
      const allQ = await this.getQuestions();
      const pool = allQ[dept] || allQ['CSE'] || [];
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 5);
    }

    // Save or update question (Admin)
    async saveQuestion(questionData) {
      const id = questionData.id || `q_${(questionData.dept || 'cse').toLowerCase()}_${Date.now().toString(36)}`;
      const cleanData = {
        id,
        dept: (questionData.dept || 'CSE').trim().toUpperCase(),
        question: (questionData.question || '').trim(),
        options: questionData.options || [],
        correctKey: (questionData.correctKey || 'a').trim().toLowerCase(),
        updatedAt: Date.now()
      };

      // Local
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS) || '{}');
        local[id] = cleanData;
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(local));
      } catch (e) { }

      // Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, setDoc } = this.firestoreOps;
          await setDoc(doc(this.db, 'questions', id), cleanData, { merge: true });
        } catch (e) {
          console.warn('Failed to save question to Firestore:', e);
        }
      }

      return cleanData;
    }

    // Delete question (Admin)
    async deleteQuestion(questionId, dept) {
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY_CUSTOM_QUESTIONS) || '{}');
        local[questionId] = { deleted: true, dept };
        localStorage.setItem(STORAGE_KEY_CUSTOM_QUESTIONS, JSON.stringify(local));
      } catch (e) { }

      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, setDoc } = this.firestoreOps;
          await setDoc(doc(this.db, 'questions', questionId), { deleted: true, dept }, { merge: true });
        } catch (e) {
          console.warn('Failed to delete question from Firestore:', e);
        }
      }

      return true;
    }

    // =========================================================================
    // PORTAL SETTINGS API (Admin: minCorrect, active departments, maintenance)
    // =========================================================================

    async getSettings() {
      const defaultSettings = {
        minCorrect: 4,
        activeDepts: ['CSE', 'EEE', 'CE'],
        maintenanceMode: false
      };

      // Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, getDoc } = this.firestoreOps;
          const snap = await getDoc(doc(this.db, 'settings', 'general'));
          if (snap.exists()) {
            return { ...defaultSettings, ...snap.data() };
          }
        } catch (e) {
          console.warn('Could not read settings from Firestore:', e);
        }
      }

      // Local
      try {
        const local = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS) || '{}');
        return { ...defaultSettings, ...local };
      } catch (e) {
        return defaultSettings;
      }
    }

    async saveSettings(settingsData) {
      const cleanData = {
        minCorrect: Number(settingsData.minCorrect) || 4,
        activeDepts: settingsData.activeDepts || ['CSE', 'EEE', 'CE'],
        maintenanceMode: Boolean(settingsData.maintenanceMode),
        updatedAt: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(cleanData));
      } catch (e) { }

      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, setDoc } = this.firestoreOps;
          await setDoc(doc(this.db, 'settings', 'general'), cleanData, { merge: true });
        } catch (e) {
          console.warn('Failed to save settings to Firestore:', e);
        }
      }

      return cleanData;
    }

    // =========================================================================
    // REVIEWS API
    // =========================================================================

    // Fetch all student reviews across all teachers (Admin)
    async getAllReviews() {
      let allReviews = [];

      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          const snap = await getDocs(collection(this.db, 'reviews'));
          snap.forEach(docSnap => {
            const rData = docSnap.data();
            allReviews.push({
              ...rData,
              firestoreDocId: docSnap.id,
              id: rData.id || docSnap.id
            });
          });
        } catch (e) {
          console.warn('Could not read reviews from Firestore:', e);
        }
      }

      // Merge local reviews (avoid duplicates)
      const localReviews = this.getLocalReviews();
      const existingIds = new Set(allReviews.map(r => r.id || r.firestoreDocId));
      for (const lr of localReviews) {
        if (!existingIds.has(lr.id)) {
          allReviews.push(lr);
        }
      }

      // Sort newest first
      allReviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return allReviews;
    }

    // Delete a review by reviewId and/or firestoreDocId (Admin)
    async deleteReview(reviewId, firestoreDocId) {
      // 1. Remove from local storage
      try {
        const local = this.getLocalReviews();
        const updated = local.filter(r => r.id !== reviewId && r.firestoreDocId !== firestoreDocId);
        this.saveLocalReviews(updated);
      } catch (e) { }

      // 2. Remove from Firestore
      if (this.isFirebaseActive && this.db) {
        try {
          const { doc, deleteDoc, collection, getDocs } = this.firestoreOps;
          if (firestoreDocId) {
            await deleteDoc(doc(this.db, 'reviews', firestoreDocId));
          } else if (reviewId) {
            try {
              await deleteDoc(doc(this.db, 'reviews', reviewId));
            } catch (err) {}
            // Also delete any doc in 'reviews' where data().id == reviewId
            const snap = await getDocs(collection(this.db, 'reviews'));
            for (const d of snap.docs) {
              if (d.data().id === reviewId || d.id === reviewId) {
                await deleteDoc(doc(this.db, 'reviews', d.id));
              }
            }
          }
        } catch (e) {
          console.warn('Failed to delete review from Firestore:', e);
        }
      }

      return true;
    }

    // Add a review for a teacher
    async addReview(teacherId, reviewData) {
      const score = Number(reviewData.score || 0);
      const starType = score > 0 ? 'yellow' : (score < 0 ? 'red' : 'white');
      const starCount = Math.abs(score);

      const review = {
        id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        teacherId: teacherId,
        author: reviewData.author || 'AnonymousStudent',
        score: score,
        starType: starType,
        starCount: starCount,
        course: (reviewData.course || '').trim(),
        comment: (reviewData.comment || '').trim(),
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        timestamp: Date.now()
      };

      // 1. Save to Local Storage immediately
      const localReviews = this.getLocalReviews();
      localReviews.unshift(review);
      this.saveLocalReviews(localReviews);

      // 2. Persist to Firebase Firestore if connected
      let firestoreSaved = false;
      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, addDoc } = this.firestoreOps;
          const docRef = await addDoc(collection(this.db, 'reviews'), review);
          if (docRef && docRef.id) {
            review.firestoreDocId = docRef.id;
          }
          firestoreSaved = true;
        } catch (e) {
          console.warn('Failed to write review to Firestore, saved locally:', e);
        }
      }

      return {
        success: true,
        review,
        firestoreSaved
      };
    }
  }

  window.dbService = new DatabaseService();
  window.FIREBASE_CONFIG = FIREBASE_CONFIG;
})();
