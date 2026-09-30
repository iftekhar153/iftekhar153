// Firebase Configuration and Database Service
// Integrated with user's megamindratings project + resilient LocalStorage fallback

(function () {
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDQUWu0V9b55-Kg8wi3QMfm404ZguMPdwA",
    authDomain: "megamindratings.firebaseapp.com",
    projectId: "megamindratings",
    storageBucket: "megamindratings.firebasestorage.app",
    messagingSenderId: "343564257626",
    appId: "1:343564257626:web:8ae672e7d5e44ea2458b63"
  };

  const STORAGE_KEY_TEACHERS = 'buet_eval_teachers_v2';
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
          getFirestore, collection, getDocs, doc, setDoc, addDoc
        } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        let app;
        const currentApps = getApps();
        if (currentApps.length > 0) {
          app = currentApps[0];
        } else {
          app = initializeApp(this.config);
        }

        this.db = getFirestore(app);
        this.firestoreOps = { collection, getDocs, doc, setDoc, addDoc };
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

    // Returns all teachers with their calculated stats and review list
    async getTeachers() {
      // 1. Start with authentic directory of 271 BUET faculty
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

      // 2. Fetch reviews: from Firestore if active, and also merge local reviews
      let allReviews = [];

      if (this.isFirebaseActive && this.db) {
        try {
          const { collection, getDocs } = this.firestoreOps;
          const reviewsSnap = await getDocs(collection(this.db, 'reviews'));
          reviewsSnap.forEach(docSnap => {
            const rData = docSnap.data();
            allReviews.push({ id: docSnap.id, ...rData });
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

      // 3. Attach reviews to respective teachers
      allReviews.forEach(rev => {
        const teacher = teacherMap.get(rev.teacherId);
        if (teacher) {
          teacher.reviews.push(rev);
        }
      });

      // 4. Calculate metrics for each teacher based on user ratings (+5 to -5)
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
          await addDoc(collection(this.db, 'reviews'), review);
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
