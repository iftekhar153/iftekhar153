// ==========================================================================
// BUET TEACHER EVALUATION — Core Application Logic
// Implements 4-Page Model from 'website page model.docx' with Day/Night Mode
// ==========================================================================

(function () {
  // Global Application State
  const state = {
    currentPage: 'pageWelcome',
    selectedDept: 'CSE',
    quizQuestions: [],
    quizAnswers: {},
    teachers: [],
    filteredTeachers: [],
    selectedTeacher: null,
    activeDeptFilter: 'ALL',
    searchQuery: '',
    sortMode: 'HIGHEST_STAR',
    page: 1,
    pageSize: 18,
    selectedRating: null, // number between -5 and +5, or null
    reviewsFilter: 'ALL'
  };

  const RATING_DESCRIPTIONS = {
    5: '★ +5 Yellow Stars — Outstanding & Inspiring Legend',
    4: '★ +4 Yellow Stars — Excellent Mentor & Clear Lectures',
    3: '★ +3 Yellow Stars — Very Good & Helpful Guidance',
    2: '★ +2 Yellow Stars — Good Teacher / Fair Expectations',
    1: '★ +1 Yellow Star — Decent / Standard Instruction',
    0: '☆ 0 Neutral Stars — Average / Neutral Experience',
    '-1': '★ -1 Red Star — Slightly Strict & Demanding',
    '-2': '★ -2 Red Stars — Strict Attendance & Fast Pacing',
    '-3': '★ -3 Red Stars — Tough Quizzes & Heavy Workload',
    '-4': '★ -4 Red Stars — Harsh Grading & Unforgiving Exams',
    '-5': '★ -5 Red Stars — Brutal Scrutiny & Extreme Strictness'
  };

  // DOM Elements cache
  let dom = {};

  function cacheDomElements() {
    dom = {
      // Navbar & Global
      brandHomeBtn: document.getElementById('brandHomeBtn'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      themeToggleIcon: document.getElementById('themeToggleIcon'),
      themeToggleText: document.getElementById('themeToggleText'),
      dbStatusBadge: document.getElementById('dbStatusBadge'),
      dbStatusText: document.getElementById('dbStatusText'),
      navUserBadge: document.getElementById('navUserBadge'),
      navUserMascot: document.getElementById('navUserMascot'),
      navUserName: document.getElementById('navUserName'),
      navVerifyPill: document.getElementById('navVerifyPill'),
      navDirectoryBtn: document.getElementById('navDirectoryBtn'),
      navVerifyBtn: document.getElementById('navVerifyBtn'),
      toastPopup: document.getElementById('toastPopup'),

      // Page Views
      pageWelcome: document.getElementById('pageWelcome'),
      pageVerify: document.getElementById('pageVerify'),
      pageDirectory: document.getElementById('pageDirectory'),
      pageReview: document.getElementById('pageReview'),

      // Page 1: Welcome
      deptSelectDropdown: document.getElementById('deptSelectDropdown'),
      startVerificationBtn: document.getElementById('startVerificationBtn'),

      // Page 2: Quiz
      quizDeptDisplay: document.getElementById('quizDeptDisplay'),
      quizQuestionsArea: document.getElementById('quizQuestionsArea'),
      quizQuestionsList: document.getElementById('quizQuestionsList'),
      submitQuizBtn: document.getElementById('submitQuizBtn'),
      quizResultScreen: document.getElementById('quizResultScreen'),
      resultSuccessBox: document.getElementById('resultSuccessBox'),
      resultScoreTextSuccess: document.getElementById('resultScoreTextSuccess'),
      anonAliasInput: document.getElementById('anonAliasInput'),
      rerollAliasBtn: document.getElementById('rerollAliasBtn'),
      currentMascotPreview: document.getElementById('currentMascotPreview'),
      mascotOptionsRow: document.getElementById('mascotOptionsRow'),
      proceedToDirectoryBtn: document.getElementById('proceedToDirectoryBtn'),
      resultFailBox: document.getElementById('resultFailBox'),
      resultScoreTextFail: document.getElementById('resultScoreTextFail'),
      retryQuizBtn: document.getElementById('retryQuizBtn'),
      changeDeptQuizBtn: document.getElementById('changeDeptQuizBtn'),

      // Page 3: Directory
      totalTeachersCount: document.getElementById('totalTeachersCount'),
      totalReviewsCount: document.getElementById('totalReviewsCount'),
      teacherSearchInput: document.getElementById('teacherSearchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      teacherSortSelect: document.getElementById('teacherSortSelect'),
      deptTabsContainer: document.getElementById('deptTabsContainer'),
      teachersListGrid: document.getElementById('teachersListGrid'),
      noTeachersFound: document.getElementById('noTeachersFound'),
      directoryPagination: document.getElementById('directoryPagination'),
      prevPageBtn: document.getElementById('prevPageBtn'),
      nextPageBtn: document.getElementById('nextPageBtn'),
      pageIndicatorText: document.getElementById('pageIndicatorText'),

      // Page 4: Review Page
      backToDirectoryBtn: document.getElementById('backToDirectoryBtn'),
      profileAvatar: document.getElementById('profileAvatar'),
      profileDeptBadge: document.getElementById('profileDeptBadge'),
      profileTeacherName: document.getElementById('profileTeacherName'),
      profileDesignation: document.getElementById('profileDesignation'),
      profileLocation: document.getElementById('profileLocation'),
      profileScoreBadge: document.getElementById('profileScoreBadge'),
      profileScoreValue: document.getElementById('profileScoreValue'),
      profileReviewsCount: document.getElementById('profileReviewsCount'),
      profileYellowCount: document.getElementById('profileYellowCount'),
      profileZeroCount: document.getElementById('profileZeroCount'),
      profileRedCount: document.getElementById('profileRedCount'),
      reviewTargetName: document.getElementById('reviewTargetName'),
      submissionAuthorDisplay: document.getElementById('submissionAuthorDisplay'),
      starScaleContainer: document.getElementById('starScaleContainer'),
      ratingFeedbackText: document.getElementById('ratingFeedbackText'),
      clearRatingBtn: document.getElementById('clearRatingBtn'),
      reviewCourseCode: document.getElementById('reviewCourseCode'),
      reviewCommentText: document.getElementById('reviewCommentText'),
      commentCharCount: document.getElementById('commentCharCount'),
      submitReviewBtn: document.getElementById('submitReviewBtn'),
      reviewsCountBadge: document.getElementById('reviewsCountBadge'),
      reviewFilterPills: document.getElementById('reviewFilterPills'),
      othersReviewsList: document.getElementById('othersReviewsList'),
      noReviewsNotice: document.getElementById('noReviewsNotice'),

      // Update 1: Review box & thanks card
      reviewSubmissionContainer: document.getElementById('reviewSubmissionContainer'),
      reviewFormContent: document.getElementById('reviewFormContent'),
      reviewThanksContent: document.getElementById('reviewThanksContent'),
      thanksTeacherName: document.getElementById('thanksTeacherName')
    };
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async function initApp() {
    cacheDomElements();
    initTheme();
    initIdentity();
    setupEventListeners();

    // Check if user already verified previously
    if (window.identityManager && window.identityManager.isVerified()) {
      state.selectedDept = window.identityManager.getDept();
      if (dom.deptSelectDropdown) dom.deptSelectDropdown.value = state.selectedDept;
    }

    // Connect to Firebase Cloud Database (or LocalStorage fallback)
    await initDatabase();

    // Load portal settings (verification pass rate, active depts)
    if (window.dbService && window.dbService.getSettings) {
      state.settings = await window.dbService.getSettings();
      if (state.settings && state.settings.activeDepts && dom.deptSelectDropdown) {
        const cur = dom.deptSelectDropdown.value;
        dom.deptSelectDropdown.innerHTML = '';
        state.settings.activeDepts.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d;
          opt.textContent = `${d} Department`;
          dom.deptSelectDropdown.appendChild(opt);
        });
        if (state.settings.activeDepts.includes(cur)) {
          dom.deptSelectDropdown.value = cur;
        }
      }
    }

    // Initial page: if user is already verified, show directory; else show Welcome (Page 1)
    if (window.identityManager && window.identityManager.isVerified()) {
      navigateToPage('pageDirectory');
    } else {
      navigateToPage('pageWelcome');
    }
  }

  // ==========================================================================
  // THEME MANAGEMENT (Day Mode vs Night Mode)
  // ==========================================================================

  function initTheme() {
    const saved = localStorage.getItem('buet_theme') || 'dark';
    applyTheme(saved);

    dom.themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('buet_theme', next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      dom.themeToggleIcon.textContent = '☀️';
      dom.themeToggleText.textContent = 'Day';
    } else {
      dom.themeToggleIcon.textContent = '🌙';
      dom.themeToggleText.textContent = 'Night';
    }
  }

  // ==========================================================================
  // IDENTITY & NAVBAR BADGE
  // ==========================================================================

  function initIdentity() {
    updateIdentityUI();

    window.addEventListener('buet-identity-change', () => {
      updateIdentityUI();
    });

    window.addEventListener('buet-verification-change', () => {
      updateIdentityUI();
    });
  }

  function updateIdentityUI() {
    if (!window.identityManager) return;
    const alias = window.identityManager.getAlias();
    const mascot = window.identityManager.getAvatar();
    const verified = window.identityManager.isVerified();

    if (dom.navUserName) dom.navUserName.textContent = alias;
    if (dom.navUserMascot) dom.navUserMascot.textContent = mascot;

    if (dom.navVerifyPill) {
      if (verified) {
        dom.navVerifyPill.textContent = 'Verified BUET';
        dom.navVerifyPill.className = 'verified-pill verified';
      } else {
        dom.navVerifyPill.textContent = 'Unverified';
        dom.navVerifyPill.className = 'verified-pill unverified';
      }
    }

    if (dom.submissionAuthorDisplay) {
      dom.submissionAuthorDisplay.textContent = `${mascot} ${alias}`;
    }
    if (dom.currentMascotPreview) {
      dom.currentMascotPreview.textContent = mascot;
    }
    if (dom.anonAliasInput) {
      dom.anonAliasInput.value = alias;
    }
  }

  // ==========================================================================
  // DATABASE SERVICE INTEGRATION
  // ==========================================================================

  async function initDatabase() {
    dom.dbStatusBadge.className = 'status-badge';
    dom.dbStatusText.textContent = 'Connecting...';

    window.addEventListener('buet-db-status', (e) => {
      const { online } = e.detail;
      if (online) {
        dom.dbStatusBadge.className = 'status-badge online';
        dom.dbStatusText.textContent = 'Firebase Cloud Live';
        dom.dbStatusBadge.title = 'Connected to Google Firebase Firestore (megamindratings)';
      } else {
        dom.dbStatusBadge.className = 'status-badge offline';
        dom.dbStatusText.textContent = 'Local Database';
        dom.dbStatusBadge.title = 'Running in offline LocalStorage mode';
      }
    });

    if (window.dbService) {
      await window.dbService.initFirebase();
      await loadTeachersDirectory();
    }
  }

  async function loadTeachersDirectory() {
    if (!window.dbService) return;
    state.teachers = await window.dbService.getTeachers();
    updateDirectoryCounts();
    applyTeacherFilters();
    if (state.selectedTeacher) {
      // Refresh current teacher if open
      const refreshed = state.teachers.find(t => t.id === state.selectedTeacher.id);
      if (refreshed) {
        state.selectedTeacher = refreshed;
        renderTeacherReviewPage(refreshed);
      }
    }
  }

  function updateDirectoryCounts() {
    const totalTeachers = state.teachers.length;
    let totalReviews = 0;
    state.teachers.forEach(t => {
      totalReviews += (t.stats ? t.stats.totalReviews : 0) || 0;
    });

    if (dom.totalTeachersCount) dom.totalTeachersCount.textContent = totalTeachers;
    if (dom.totalReviewsCount) dom.totalReviewsCount.textContent = totalReviews;
  }

  // ==========================================================================
  // ROUTING & PAGE NAVIGATION
  // ==========================================================================

  // ==========================================================================
  // ROUTING & NAVBAR VISIBILITY RULES (Update 1)
  // ==========================================================================

  function updateNavbarState(pageId) {
    const isVerified = window.identityManager && window.identityManager.isVerified();

    if (pageId === 'pageWelcome' || pageId === 'pageVerify') {
      // 1st or 2nd page:
      // "This option must not be seen by the user when he is in 1st or 2nd page"
      if (dom.navDirectoryBtn) dom.navDirectoryBtn.style.display = 'none';
      if (dom.navVerifyBtn) dom.navVerifyBtn.style.display = 'none';
      if (dom.navUserBadge) dom.navUserBadge.style.display = 'none';
    } else {
      // 3rd or 4th page:
      // "User can move between 3rd and 4th page."
      if (dom.navDirectoryBtn) dom.navDirectoryBtn.style.display = 'inline-flex';
      // "This must be gone in 3rd or 4th page"
      if (dom.navVerifyBtn) dom.navVerifyBtn.style.display = 'none';
      // "His name will be frozen and cant be edited anymore once he step in 3rd page."
      if (dom.navUserBadge) {
        dom.navUserBadge.style.display = 'inline-flex';
        dom.navUserBadge.classList.add('frozen');
        dom.navUserBadge.style.cursor = 'default';
        dom.navUserBadge.style.pointerEvents = 'none';
        dom.navUserBadge.title = 'Anonymous Student (Verified & Locked)';
      }
    }
  }

  function navigateToPage(pageId) {
    const isVerified = window.identityManager && window.identityManager.isVerified();

    // RULE from Update 1:
    // "Once he is verified , he will be taken to the 3rd page and he can no longer go back to the 1st or 2nd page."
    if (isVerified && (pageId === 'pageWelcome' || pageId === 'pageVerify')) {
      pageId = 'pageDirectory';
    }

    const views = [dom.pageWelcome, dom.pageVerify, dom.pageDirectory, dom.pageReview];
    views.forEach(v => {
      if (v) v.classList.remove('active');
    });

    const target = dom[pageId];
    if (target) {
      target.classList.add('active');
      state.currentPage = pageId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateNavbarState(pageId);

    if (pageId === 'pageDirectory') {
      applyTeacherFilters();
    }
  }

  // ==========================================================================
  // EVENT LISTENERS SETUP
  // ==========================================================================

  function setupEventListeners() {
    // Brand click: If verified -> Page 3 (Directory); Else -> Page 1 (Welcome)
    dom.brandHomeBtn.addEventListener('click', () => {
      if (window.identityManager && window.identityManager.isVerified()) {
        navigateToPage('pageDirectory');
      } else {
        navigateToPage('pageWelcome');
      }
    });

    // Move between 3rd and 4th page
    dom.navDirectoryBtn.addEventListener('click', () => {
      navigateToPage('pageDirectory');
    });

    // Page 1: Start Verification
    dom.startVerificationBtn.addEventListener('click', () => {
      const dept = dom.deptSelectDropdown.value;
      state.selectedDept = dept;
      startVerificationQuiz(dept);
    });

    // Page 2: Quiz submission & Retries
    dom.submitQuizBtn.addEventListener('click', handleQuizSubmission);

    dom.retryQuizBtn.addEventListener('click', () => {
      startVerificationQuiz(state.selectedDept);
    });

    dom.changeDeptQuizBtn.addEventListener('click', () => {
      navigateToPage('pageWelcome');
    });

    // Page 2: Persona Customization
    dom.rerollAliasBtn.addEventListener('click', () => {
      const res = window.identityManager.reroll();
      dom.anonAliasInput.value = res.alias;
      dom.currentMascotPreview.textContent = res.avatar;
      renderMascotPicker();
      showToast('Rolled new random handle: ' + res.alias);
    });

    dom.anonAliasInput.addEventListener('input', (e) => {
      window.identityManager.setAlias(e.target.value);
    });

    dom.proceedToDirectoryBtn.addEventListener('click', () => {
      const typed = (dom.anonAliasInput.value || '').trim();
      if (typed) window.identityManager.setAlias(typed);
      showToast('Welcome, ' + window.identityManager.getAlias() + '! You are verified.');
      navigateToPage('pageDirectory');
    });

    // Page 3: Directory Controls
    dom.teacherSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      dom.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
      state.page = 1;
      applyTeacherFilters();
    });

    dom.clearSearchBtn.addEventListener('click', () => {
      dom.teacherSearchInput.value = '';
      state.searchQuery = '';
      dom.clearSearchBtn.style.display = 'none';
      state.page = 1;
      applyTeacherFilters();
    });

    dom.teacherSortSelect.addEventListener('change', (e) => {
      state.sortMode = e.target.value;
      state.page = 1;
      applyTeacherFilters();
    });

    // Department tabs
    dom.deptTabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.dept-tab');
      if (!tab) return;
      dom.deptTabsContainer.querySelectorAll('.dept-tab').forEach(b => b.classList.remove('active'));
      tab.classList.add('active');
      state.activeDeptFilter = tab.getAttribute('data-dept');
      state.page = 1;
      applyTeacherFilters();
    });

    // Directory Pagination
    dom.prevPageBtn.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        renderTeachersList();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    });

    dom.nextPageBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(state.filteredTeachers.length / state.pageSize) || 1;
      if (state.page < totalPages) {
        state.page++;
        renderTeachersList();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    });

    // Page 4: Review Page
    dom.backToDirectoryBtn.addEventListener('click', () => {
      navigateToPage('pageDirectory');
    });

    // 11 Star Scale Buttons
    dom.starScaleContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.scale-star-btn');
      if (!btn) return;
      const rating = Number(btn.getAttribute('data-rating'));

      // If already selected, deselect it
      if (state.selectedRating === rating) {
        clearStarSelection();
      } else {
        selectRating(rating);
      }
    });

    dom.clearRatingBtn.addEventListener('click', clearStarSelection);

    // Comment Box Char Counter
    dom.reviewCommentText.addEventListener('input', (e) => {
      const len = e.target.value.length;
      dom.commentCharCount.textContent = `${len} / 600`;
    });

    // Submit Review Button
    dom.submitReviewBtn.addEventListener('click', handleReviewSubmit);

    // Review Filter Pills (All / Yellow / Neutral / Red)
    dom.reviewFilterPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.rev-filter-pill');
      if (!pill) return;
      dom.reviewFilterPills.querySelectorAll('.rev-filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.reviewsFilter = pill.getAttribute('data-filter');
      if (state.selectedTeacher) {
        renderOthersReviews(state.selectedTeacher.reviews || []);
      }
    });
  }

  // ==========================================================================
  // PAGE 2: VERIFICATION CHALLENGE (5 QUESTIONS, NO ANSWERS SHOWN UNTIL FINAL)
  // ==========================================================================

  async function startVerificationQuiz(dept) {
    state.selectedDept = dept;
    state.quizAnswers = {};
    if (window.dbService && window.dbService.getQuestionsForDept) {
      state.quizQuestions = await window.dbService.getQuestionsForDept(dept);
    } else {
      state.quizQuestions = window.getQuestionsForDept ? window.getQuestionsForDept(dept) : [];
    }

    dom.quizDeptDisplay.textContent = `Dept: ${dept}`;
    dom.quizQuestionsArea.style.display = 'block';
    dom.quizResultScreen.style.display = 'none';
    dom.resultSuccessBox.style.display = 'none';
    dom.resultFailBox.style.display = 'none';

    renderQuizQuestions();
    navigateToPage('pageVerify');
  }

  function renderQuizQuestions() {
    dom.quizQuestionsList.innerHTML = '';

    state.quizQuestions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.setAttribute('data-qid', q.id);

      const header = document.createElement('div');
      header.className = 'question-header';
      header.innerHTML = `
        <span class="question-num-badge">Question ${index + 1} of 5</span>
        <span class="question-title-text">${q.question}</span>
      `;
      card.appendChild(header);

      const grid = document.createElement('div');
      grid.className = 'options-grid';

      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        btn.setAttribute('data-key', opt.key);
        btn.innerHTML = `
          <span class="option-key">${opt.key.toUpperCase()}</span>
          <span class="option-text">${opt.text}</span>
        `;

        btn.addEventListener('click', () => {
          // Select this option
          grid.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          state.quizAnswers[q.id] = opt.key;
        });

        grid.appendChild(btn);
      });

      card.appendChild(grid);
      dom.quizQuestionsList.appendChild(card);
    });
  }

  function handleQuizSubmission() {
    // Validate that all 5 questions are answered
    const answeredCount = Object.keys(state.quizAnswers).length;
    if (answeredCount < state.quizQuestions.length) {
      showToast(`Please answer all 5 questions before submitting. (${answeredCount}/5 answered)`, 'error');
      return;
    }

    // Evaluate score
    let score = 0;
    state.quizQuestions.forEach(q => {
      if (state.quizAnswers[q.id] === q.correctKey) {
        score++;
      }
    });

    // Hide quiz area, show results screen
    dom.quizQuestionsArea.style.display = 'none';
    dom.quizResultScreen.style.display = 'block';

    const minRequired = (state.settings && state.settings.minCorrect) || 4;

    if (score >= minRequired) {
      // Verification Passed (meets required threshold)
      dom.resultSuccessBox.style.display = 'block';
      dom.resultFailBox.style.display = 'none';
      dom.resultScoreTextSuccess.textContent = `You scored ${score} out of 5! You are verified as a genuine BUET-ian.`;

      // Save verification state
      window.identityManager.setVerified(state.selectedDept, score);

      // Setup Persona Form
      renderMascotPicker();
      dom.anonAliasInput.value = window.identityManager.getAlias();
      dom.currentMascotPreview.textContent = window.identityManager.getAvatar();
    } else {
      // Verification Failed (< minRequired)
      dom.resultSuccessBox.style.display = 'none';
      dom.resultFailBox.style.display = 'block';
      dom.resultScoreTextFail.textContent = `You scored ${score} out of 5 correct. A minimum of ${minRequired} out of 5 is required to verify BUET student status.`;
    }
  }

  function renderMascotPicker() {
    dom.mascotOptionsRow.innerHTML = '';
    const currentAvatar = window.identityManager.getAvatar();
    const mascots = window.BUET_MASCOTS || ['🦊', '🐺', '🦅', '🦉', '🐉', '🦡', '⚡', '🚀', '🐼', '🛡️'];

    mascots.forEach(m => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mascot-btn' + (m === currentAvatar ? ' selected' : '');
      btn.textContent = m;
      btn.title = `Select mascot ${m}`;

      btn.addEventListener('click', () => {
        window.identityManager.setAvatar(m);
        dom.currentMascotPreview.textContent = m;
        dom.mascotOptionsRow.querySelectorAll('.mascot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });

      dom.mascotOptionsRow.appendChild(btn);
    });
  }

  // ==========================================================================
  // PAGE 3: TEACHER DIRECTORY & FILTERING
  // ==========================================================================

  function applyTeacherFilters() {
    let list = [...state.teachers];

    // 1. Department filter
    if (state.activeDeptFilter !== 'ALL') {
      list = list.filter(t => t.deptCode === state.activeDeptFilter);
    }

    // 2. Search query (matches teacher name, department, or location)
    if (state.searchQuery) {
      list = list.filter(t => {
        const nameMatch = (t.name || '').toLowerCase().includes(state.searchQuery);
        const deptMatch = (t.dept || '').toLowerCase().includes(state.searchQuery);
        const desigMatch = (t.designation || '').toLowerCase().includes(state.searchQuery);
        return nameMatch || deptMatch || desigMatch;
      });
    }

    // 3. Sorting (Default: Highest Star to Lowest, +5 to -5)
    list.sort((a, b) => {
      const statsA = a.stats || { avgScore: 0, totalReviews: 0, netScore: 0 };
      const statsB = b.stats || { avgScore: 0, totalReviews: 0, netScore: 0 };

      switch (state.sortMode) {
        case 'HIGHEST_STAR':
          // Teachers with highest avg score first; tie breaker: total reviews
          if (statsB.avgScore !== statsA.avgScore) {
            return statsB.avgScore - statsA.avgScore;
          }
          return statsB.totalReviews - statsA.totalReviews;

        case 'MOST_REVIEWS':
          if (statsB.totalReviews !== statsA.totalReviews) {
            return statsB.totalReviews - statsA.totalReviews;
          }
          return statsB.avgScore - statsA.avgScore;

        case 'LOWEST_STAR':
          if (statsA.avgScore !== statsB.avgScore) {
            return statsA.avgScore - statsB.avgScore;
          }
          return statsB.totalReviews - statsA.totalReviews;

        case 'NAME_ASC':
          return (a.name || '').localeCompare(b.name || '');

        default:
          return statsB.avgScore - statsA.avgScore;
      }
    });

    state.filteredTeachers = list;
    renderTeachersList();
  }

  function renderTeachersList() {
    const total = state.filteredTeachers.length;

    if (total === 0) {
      dom.teachersListGrid.innerHTML = '';
      dom.noTeachersFound.style.display = 'block';
      dom.directoryPagination.style.display = 'none';
      return;
    }

    dom.noTeachersFound.style.display = 'none';
    dom.directoryPagination.style.display = 'flex';

    // Pagination calculations
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    const startIdx = (state.page - 1) * state.pageSize;
    const paginated = state.filteredTeachers.slice(startIdx, startIdx + state.pageSize);

    dom.pageIndicatorText.textContent = `Page ${state.page} of ${totalPages} (${total} faculty members)`;
    dom.prevPageBtn.disabled = state.page <= 1;
    dom.nextPageBtn.disabled = state.page >= totalPages;

    dom.teachersListGrid.innerHTML = '';

    paginated.forEach(teacher => {
      const card = createTeacherCard(teacher);
      dom.teachersListGrid.appendChild(card);
    });
  }

  function createTeacherCard(teacher) {
    const stats = teacher.stats || { avgScore: 0, totalReviews: 0, yellowStars: 0, redStars: 0, zeroStars: 0 };
    const avg = stats.avgScore || 0;
    const totalRev = stats.totalReviews || 0;

    let scoreClass = 'zero';
    let formattedScore = avg.toFixed(1);
    if (avg > 0) {
      scoreClass = 'positive';
      formattedScore = '+' + formattedScore;
    } else if (avg < 0) {
      scoreClass = 'negative';
    }

    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.setAttribute('data-id', teacher.id);

    card.innerHTML = `
      <div class="teacher-card-top">
        <span class="teacher-dept-pill">${teacher.deptCode || 'BUET'}</span>
        <div class="card-score-badge ${scoreClass}" title="Average Star Score: ${formattedScore} (+5 to -5 scale)">
          <span>${formattedScore}</span>
          <span>★</span>
        </div>
      </div>

      <div class="teacher-card-body">
        <h3>${escapeHtml(teacher.name)}</h3>
        <p class="teacher-desig">${escapeHtml(teacher.designation || 'Faculty Member')}</p>
        <p class="teacher-dept-name">${escapeHtml(teacher.dept || '')}</p>
      </div>

      <div class="teacher-card-bottom">
        <span class="review-count-stat">
          ${totalRev === 0 ? 'No reviews yet' : `${totalRev} review${totalRev > 1 ? 's' : ''}`}
        </span>
        <span class="card-action-link">
          Rate &amp; View Reviews &rarr;
        </span>
      </div>
    `;

    card.addEventListener('click', () => {
      openTeacherReviewPage(teacher);
    });

    return card;
  }

  // ==========================================================================
  // PAGE 4: TEACHER EVALUATION & REVIEW SUBMISSION
  // ==========================================================================

  // Track reviewed teachers in this session (Update 1)
  const reviewedTeacherIds = new Set(JSON.parse(sessionStorage.getItem('buet_reviewed_teachers') || '[]'));

  function openTeacherReviewPage(teacher) {
    state.selectedTeacher = teacher;
    clearStarSelection();
    dom.reviewCourseCode.value = '';
    dom.reviewCommentText.value = '';
    dom.commentCharCount.textContent = '0 / 600';
    state.reviewsFilter = 'ALL';
    dom.reviewFilterPills.querySelectorAll('.rev-filter-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-filter') === 'ALL');
    });

    // Check if user already submitted a review for this teacher (Update 1)
    if (reviewedTeacherIds.has(teacher.id)) {
      if (dom.reviewFormContent) dom.reviewFormContent.style.display = 'none';
      if (dom.reviewThanksContent) {
        dom.reviewThanksContent.style.display = 'block';
        if (dom.thanksTeacherName) dom.thanksTeacherName.textContent = teacher.name;
      }
    } else {
      if (dom.reviewFormContent) dom.reviewFormContent.style.display = 'block';
      if (dom.reviewThanksContent) dom.reviewThanksContent.style.display = 'none';
    }

    renderTeacherReviewPage(teacher);
    navigateToPage('pageReview');
  }

  function renderTeacherReviewPage(teacher) {
    const stats = teacher.stats || { avgScore: 0, totalReviews: 0, yellowStars: 0, redStars: 0, zeroStars: 0 };
    const avg = stats.avgScore || 0;
    const totalRev = stats.totalReviews || 0;

    dom.profileTeacherName.textContent = teacher.name;
    dom.profileDesignation.textContent = teacher.designation || 'Faculty Member';
    dom.profileDeptBadge.textContent = teacher.deptCode || 'BUET';
    dom.profileLocation.textContent = `📍 ${teacher.location || teacher.dept || 'BUET Campus'}`;
    dom.reviewTargetName.textContent = teacher.name;

    // Score badge
    let scoreClass = 'neutral';
    let formattedScore = avg.toFixed(1);
    if (avg > 0) {
      scoreClass = 'positive';
      formattedScore = '+' + formattedScore;
    } else if (avg < 0) {
      scoreClass = 'negative';
    }

    dom.profileScoreValue.textContent = formattedScore;
    dom.profileScoreBadge.className = `profile-score-badge ${scoreClass}`;
    dom.profileReviewsCount.textContent = `${totalRev} review${totalRev === 1 ? '' : 's'}`;

    dom.profileYellowCount.textContent = stats.yellowStars || 0;
    dom.profileZeroCount.textContent = stats.zeroStars || 0;
    dom.profileRedCount.textContent = stats.redStars || 0;

    // Reviews list
    renderOthersReviews(teacher.reviews || []);
  }

  // Star Rating Selection (+5 to -5)
  function selectRating(rating) {
    state.selectedRating = rating;

    // Update buttons UI
    dom.starScaleContainer.querySelectorAll('.scale-star-btn').forEach(btn => {
      const bRating = Number(btn.getAttribute('data-rating'));
      btn.classList.toggle('active', bRating === rating);
    });

    // Update description feedback
    const desc = RATING_DESCRIPTIONS[rating] || `Rating: ${rating}`;
    dom.ratingFeedbackText.textContent = desc;
    dom.clearRatingBtn.style.display = 'inline-block';
  }

  function clearStarSelection() {
    state.selectedRating = null;
    dom.starScaleContainer.querySelectorAll('.scale-star-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    dom.ratingFeedbackText.textContent = 'No star selected yet';
    dom.clearRatingBtn.style.display = 'none';
  }

  // Submit Review
  async function handleReviewSubmit() {
    if (!state.selectedTeacher) return;

    if (state.selectedRating === null) {
      showToast('Please select a star rating (+5 to -5 or 0) before submitting.', 'error');
      return;
    }

    const comment = dom.reviewCommentText.value.trim();
    if (!comment) {
      showToast('Please write a review comment for this teacher.', 'error');
      dom.reviewCommentText.focus();
      return;
    }

    const course = dom.reviewCourseCode.value.trim();
    const author = `${window.identityManager.getAvatar()} ${window.identityManager.getAlias()}`;

    dom.submitReviewBtn.disabled = true;
    dom.submitReviewBtn.textContent = 'Submitting...';

    const reviewData = {
      score: state.selectedRating,
      course: course,
      comment: comment,
      author: author
    };

    try {
      const res = await window.dbService.addReview(state.selectedTeacher.id, reviewData);
      showToast('🎉 Thanks for the review!');

      // Record this teacher as reviewed (Update 1)
      reviewedTeacherIds.add(state.selectedTeacher.id);
      sessionStorage.setItem('buet_reviewed_teachers', JSON.stringify(Array.from(reviewedTeacherIds)));

      // RULE from Update 1:
      // "Once an user submit their review only the star and review box will be gone and he will see 'thanks for the review'"
      // "Only This will be gone when user click submit. He can still see the rest of the things in 4th page"
      if (dom.reviewFormContent) dom.reviewFormContent.style.display = 'none';
      if (dom.reviewThanksContent) {
        dom.reviewThanksContent.style.display = 'block';
        if (dom.thanksTeacherName) dom.thanksTeacherName.textContent = state.selectedTeacher.name;
      }

      // Refresh directory and current teacher
      await loadTeachersDirectory();

      // Reset form
      clearStarSelection();
      dom.reviewCourseCode.value = '';
      dom.reviewCommentText.value = '';
      dom.commentCharCount.textContent = '0 / 600';
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Failed to submit review. Saved locally.', 'error');
    } finally {
      dom.submitReviewBtn.disabled = false;
      dom.submitReviewBtn.textContent = 'Submit';
    }
  }

  // Render Reviews of Others
  function renderOthersReviews(reviews) {
    let filtered = [...reviews];

    if (state.reviewsFilter === 'YELLOW') {
      filtered = filtered.filter(r => Number(r.score) > 0);
    } else if (state.reviewsFilter === 'ZERO') {
      filtered = filtered.filter(r => Number(r.score) === 0);
    } else if (state.reviewsFilter === 'RED') {
      filtered = filtered.filter(r => Number(r.score) < 0);
    }

    dom.reviewsCountBadge.textContent = reviews.length;

    if (filtered.length === 0) {
      dom.othersReviewsList.innerHTML = '';
      dom.noReviewsNotice.style.display = 'block';
      return;
    }

    dom.noReviewsNotice.style.display = 'none';
    dom.othersReviewsList.innerHTML = '';

    filtered.forEach(rev => {
      const item = createReviewCard(rev);
      dom.othersReviewsList.appendChild(item);
    });
  }

  function createReviewCard(rev) {
    const score = Number(rev.score || 0);
    let pillClass = 'neutral';
    let pillText = `0 ☆ Neutral`;

    if (score > 0) {
      pillClass = 'yellow';
      pillText = `+${score} ★ (${score} Yellow Stars)`;
    } else if (score < 0) {
      pillClass = 'red';
      pillText = `${score} ★ (${Math.abs(score)} Red Stars)`;
    }

    const card = document.createElement('div');
    card.className = 'review-item-card';

    // Parse author mascot and name
    const authorStr = rev.author || 'Anonymous Student';
    const parts = authorStr.split(' ');
    const mascot = parts.length > 1 ? parts[0] : '🦊';
    const name = parts.length > 1 ? parts.slice(1).join(' ') : authorStr;

    card.innerHTML = `
      <div class="review-item-header">
        <div class="review-author-wrap">
          <span class="review-author-mascot">${mascot}</span>
          <span class="review-author-name">${escapeHtml(name)}</span>
          <span class="review-date">${escapeHtml(rev.date || 'Recent')}</span>
        </div>
        <div class="review-rating-pill ${pillClass}">
          ${pillText}
        </div>
      </div>

      ${rev.course ? `<span class="review-course-tag">Course: ${escapeHtml(rev.course)}</span>` : ''}

      <div class="review-comment-body">${escapeHtml(rev.comment || '')}</div>
    `;

    return card;
  }

  // ==========================================================================
  // UTILITIES & NOTIFICATIONS
  // ==========================================================================

  let toastTimeout = null;
  function showToast(message, type = 'success') {
    if (!dom.toastPopup) return;
    clearTimeout(toastTimeout);

    dom.toastPopup.textContent = message;
    dom.toastPopup.className = `toast-popup visible ${type}`;

    toastTimeout = setTimeout(() => {
      dom.toastPopup.classList.remove('visible');
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
