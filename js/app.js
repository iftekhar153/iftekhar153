// BUET Teacher Evaluation & Rating Portal - Core Application Logic

(function () {
  // Global State
  const state = {
    teachers: [],
    filteredTeachers: [],
    selectedTeacher: null,
    currentQuestion: null,
    pendingTeacherIdForReview: null,
    activeDept: 'ALL',
    activeDesig: 'ALL',
    searchQuery: '',
    sortMode: 'GREEN', // 'GREEN', 'RED', 'REVIEWS', 'NAME'
    page: 1,
    pageSize: 15,
    newReview: {
      greenStars: 5,
      redStars: 1,
      course: '',
      tags: [],
      comment: ''
    }
  };

  const GREEN_LABELS = {
    1: '1 - Decent',
    2: '2 - Good Lecturer',
    3: '3 - Very Helpful',
    4: '4 - Excellent Teacher',
    5: '5 - Inspiring Legend'
  };

  const RED_LABELS = {
    1: '1 - Minor Strictness',
    2: '2 - Strict Attendance',
    3: '3 - Tough Questions',
    4: '4 - Brutal Grading',
    5: '5 - Extreme Scrutiny'
  };

  // DOM Elements cache
  let el = {};

  function initElements() {
    el = {
      themeToggle: document.getElementById('themeToggle'),
      anonPill: document.getElementById('anonPill'),
      anonMascot: document.getElementById('anonMascot'),
      anonName: document.getElementById('anonName'),
      anonVerifyStatus: document.getElementById('anonVerifyStatus'),
      firebasePill: document.getElementById('firebasePill'),
      firebaseDot: document.getElementById('firebaseDot'),
      firebaseStatusText: document.getElementById('firebaseStatusText'),
      
      // Hero
      heroVerifyBtn: document.getElementById('heroVerifyBtn'),
      heroSuggestBtn: document.getElementById('heroSuggestBtn'),
      statTeachersCount: document.getElementById('statTeachersCount'),
      statReviewsCount: document.getElementById('statReviewsCount'),
      statDeptsCount: document.getElementById('statDeptsCount'),

      // Leaderboard
      greenLeaderboard: document.getElementById('greenLeaderboard'),
      redLeaderboard: document.getElementById('redLeaderboard'),

      // Directory & Filters
      searchInput: document.getElementById('searchInput'),
      deptScrollRow: document.getElementById('deptScrollRow'),
      desigFilter: document.getElementById('desigFilter'),
      sortFilter: document.getElementById('sortFilter'),
      teachersGrid: document.getElementById('teachersGrid'),
      prevPageBtn: document.getElementById('prevPageBtn'),
      nextPageBtn: document.getElementById('nextPageBtn'),
      pageIndicator: document.getElementById('pageIndicator'),

      // Modals
      verifyModal: document.getElementById('verifyModal'),
      verifyCloseBtn: document.getElementById('verifyCloseBtn'),
      verifyQuestionText: document.getElementById('verifyQuestionText'),
      verifyHint: document.getElementById('verifyHint'),
      verifyAnswerInput: document.getElementById('verifyAnswerInput'),
      verifySubmitBtn: document.getElementById('verifySubmitBtn'),
      verifyToggleHintBtn: document.getElementById('verifyToggleHintBtn'),

      aliasModal: document.getElementById('aliasModal'),
      aliasCloseBtn: document.getElementById('aliasCloseBtn'),
      aliasInput: document.getElementById('aliasInput'),
      aliasRerollBtn: document.getElementById('aliasRerollBtn'),
      aliasSaveBtn: document.getElementById('aliasSaveBtn'),
      mascotPickerGrid: document.getElementById('mascotPickerGrid'),

      teacherModal: document.getElementById('teacherModal'),
      teacherModalCloseBtn: document.getElementById('teacherModalCloseBtn'),
      teacherModalBody: document.getElementById('teacherModalBody'),

      reviewModal: document.getElementById('reviewModal'),
      reviewModalCloseBtn: document.getElementById('reviewModalCloseBtn'),
      reviewTeacherName: document.getElementById('reviewTeacherName'),
      reviewCourseInput: document.getElementById('reviewCourseInput'),
      reviewCommentInput: document.getElementById('reviewCommentInput'),
      reviewCommentCharCount: document.getElementById('reviewCommentCharCount'),
      reviewSubmitBtn: document.getElementById('reviewSubmitBtn'),
      greenStarRow: document.getElementById('greenStarRow'),
      redStarRow: document.getElementById('redStarRow'),
      greenStarLabel: document.getElementById('greenStarLabel'),
      redStarLabel: document.getElementById('redStarLabel'),
      tagChipsContainer: document.getElementById('tagChipsContainer'),

      firebaseModal: document.getElementById('firebaseModal'),
      firebaseCloseBtn: document.getElementById('firebaseCloseBtn'),
      fbApiKey: document.getElementById('fbApiKey'),
      fbProjectId: document.getElementById('fbProjectId'),
      fbAuthDomain: document.getElementById('fbAuthDomain'),
      fbAppId: document.getElementById('fbAppId'),
      fbSaveBtn: document.getElementById('fbSaveBtn'),
      fbResetBtn: document.getElementById('fbResetBtn'),

      addTeacherModal: document.getElementById('addTeacherModal'),
      addTeacherCloseBtn: document.getElementById('addTeacherCloseBtn'),
      addTeacherForm: document.getElementById('addTeacherForm'),

      toastContainer: document.getElementById('toastContainer')
    };
  }

  // Application Entry Point
  async function init() {
    initElements();
    setupTheme();
    setupEventListeners();
    updateIdentityBadge();
    
    // Attempt Firebase connection (or local fallback)
    await window.dbService.initFirebase();
    updateFirebaseBadge();

    // Load data
    await loadTeachers();
  }

  // Theme Management
  function setupTheme() {
    const savedTheme = localStorage.getItem('buet_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    el.themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    el.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('buet_theme', next);
      el.themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
    });
  }

  // Load and refresh teachers
  async function loadTeachers() {
    state.teachers = await window.dbService.getTeachers();
    updateStatsCounter();
    renderLeaderboard();
    applyFilters();
  }

  function updateStatsCounter() {
    el.statTeachersCount.textContent = state.teachers.length;
    let totalRev = 0;
    const depts = new Set();
    state.teachers.forEach(t => {
      totalRev += (t.stats?.totalReviews || 0);
      if (t.deptCode) depts.add(t.deptCode);
    });
    el.statReviewsCount.textContent = totalRev;
    el.statDeptsCount.textContent = depts.size;
  }

  // Leaderboard rendering
  function renderLeaderboard() {
    // Green Leaderboard (Hall of Praise)
    // Sorted by most green points or highest green stars
    const greenTop = [...state.teachers]
      .filter(t => (t.stats?.totalReviews || 0) > 0)
      .sort((a, b) => {
        const diff = (b.stats?.greenPoints || 0) - (a.stats?.greenPoints || 0);
        if (diff !== 0) return diff;
        return (b.stats?.greenStars || 0) - (a.stats?.greenStars || 0);
      })
      .slice(0, 5);

    // Red Leaderboard (Hall of Scrutiny / Caution)
    // Sorted by most red points or highest red stars
    const redTop = [...state.teachers]
      .filter(t => (t.stats?.totalReviews || 0) > 0)
      .sort((a, b) => {
        const diff = (b.stats?.redPoints || 0) - (a.stats?.redPoints || 0);
        if (diff !== 0) return diff;
        return (b.stats?.redStars || 0) - (a.stats?.redStars || 0);
      })
      .slice(0, 5);

    el.greenLeaderboard.innerHTML = greenTop.map((t, idx) => `
      <div class="leader-card" data-teacher-id="${t.id}">
        <div class="leader-left">
          <span class="rank-badge rank-${idx + 1}">${idx + 1}</span>
          <div class="leader-avatar" style="background: ${t.avatarColor || '#10b981'};">
            ${getInitials(t.name)}
          </div>
          <div class="leader-info">
            <span class="leader-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
            <div class="leader-meta">
              <span class="dept-pill-small">${t.deptCode || 'BUET'}</span>
              <span>${escapeHtml(t.designation)}</span>
            </div>
          </div>
        </div>
        <div class="leader-right">
          <div class="star-rating-pill star-pill-green">
            <span>★</span>
            <span>${t.stats.greenStars.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `).join('');

    el.redLeaderboard.innerHTML = redTop.map((t, idx) => `
      <div class="leader-card" data-teacher-id="${t.id}">
        <div class="leader-left">
          <span class="rank-badge rank-${idx + 1}">${idx + 1}</span>
          <div class="leader-avatar" style="background: ${t.avatarColor || '#f43f5e'};">
            ${getInitials(t.name)}
          </div>
          <div class="leader-info">
            <span class="leader-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</span>
            <div class="leader-meta">
              <span class="dept-pill-small">${t.deptCode || 'BUET'}</span>
              <span>${escapeHtml(t.designation)}</span>
            </div>
          </div>
        </div>
        <div class="leader-right">
          <div class="star-rating-pill star-pill-red">
            <span>★</span>
            <span>${t.stats.redStars.toFixed(1)}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Attach click listeners to cards
    document.querySelectorAll('.leader-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-teacher-id');
        openTeacherModal(id);
      });
    });
  }

  // Directory Filters and Grid Rendering
  function applyFilters() {
    let list = [...state.teachers];

    // Department Filter
    if (state.activeDept !== 'ALL') {
      list = list.filter(t => t.deptCode === state.activeDept);
    }

    // Designation Filter
    if (state.activeDesig !== 'ALL') {
      list = list.filter(t => t.designation === state.activeDesig);
    }

    // Search Query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) ||
        (t.dept && t.dept.toLowerCase().includes(q)) ||
        (t.deptCode && t.deptCode.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (state.sortMode === 'GREEN') {
      list.sort((a, b) => (b.stats?.greenStars || 0) - (a.stats?.greenStars || 0));
    } else if (state.sortMode === 'RED') {
      list.sort((a, b) => (b.stats?.redStars || 0) - (a.stats?.redStars || 0));
    } else if (state.sortMode === 'REVIEWS') {
      list.sort((a, b) => (b.stats?.totalReviews || 0) - (a.stats?.totalReviews || 0));
    } else if (state.sortMode === 'NAME') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    state.filteredTeachers = list;
    state.page = 1;
    renderTeacherGrid();
  }

  function renderTeacherGrid() {
    const total = state.filteredTeachers.length;
    const totalPages = Math.ceil(total / state.pageSize) || 1;
    state.page = Math.max(1, Math.min(state.page, totalPages));

    const start = (state.page - 1) * state.pageSize;
    const pageItems = state.filteredTeachers.slice(start, start + state.pageSize);

    el.pageIndicator.textContent = `Page ${state.page} of ${totalPages} (${total} Teachers)`;
    el.prevPageBtn.disabled = state.page <= 1;
    el.nextPageBtn.disabled = state.page >= totalPages;

    if (pageItems.length === 0) {
      el.teachersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3>No faculty members match your current filter</h3>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">Try clearing your search query or selecting a different department.</p>
        </div>
      `;
      return;
    }

    el.teachersGrid.innerHTML = pageItems.map(t => {
      const stats = t.stats || { greenStars: 0, redStars: 0, totalReviews: 0, netApproval: 50 };
      const net = stats.netApproval || 50;

      return `
        <div class="teacher-card" data-teacher-id="${t.id}">
          <div class="teacher-card-top">
            <div class="teacher-avatar-large" style="background: ${t.avatarColor || '#3B82F6'};">
              ${getInitials(t.name)}
            </div>
            <div class="teacher-card-meta">
              <h3 class="teacher-card-name" title="${escapeHtml(t.name)}">${escapeHtml(t.name)}</h3>
              <span class="teacher-card-desig">${escapeHtml(t.designation)}</span>
              <span class="teacher-card-dept">${t.deptCode || 'BUET'} &bull; ${escapeHtml(t.dept || '')}</span>
            </div>
          </div>

          <div class="dual-rating-strip">
            <div class="strip-item green">
              <span class="strip-score">★ ${stats.greenStars.toFixed(1)}</span>
              <span class="strip-label">Green (Positive)</span>
            </div>
            <div class="strip-item red">
              <span class="strip-score">★ ${stats.redStars.toFixed(1)}</span>
              <span class="strip-label">Red (Critical)</span>
            </div>
          </div>

          <div class="approval-bar-wrap">
            <div class="approval-bar-labels">
              <span>Approval Index</span>
              <span style="font-weight: 700; color: ${net >= 50 ? 'var(--green-star)' : 'var(--red-star)'}">${net}%</span>
            </div>
            <div class="approval-track">
              <div class="approval-fill-green" style="width: ${net}%;"></div>
            </div>
          </div>

          <div class="teacher-card-footer">
            <span class="reviews-count-text">${stats.totalReviews} review${stats.totalReviews === 1 ? '' : 's'}</span>
            <button class="btn-view-teacher" data-id="${t.id}">
              <span>View & Rate</span> &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click events
    el.teachersGrid.querySelectorAll('.teacher-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-teacher-id');
        openTeacherModal(id);
      });
    });
  }

  // Teacher Profile & Review Modal
  function openTeacherModal(teacherId) {
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    state.selectedTeacher = teacher;

    const stats = teacher.stats || { greenStars: 0, redStars: 0, totalReviews: 0, netApproval: 50 };
    const reviews = teacher.reviews || [];

    el.teacherModalBody.innerHTML = `
      <div class="teacher-modal-summary">
        <div class="teacher-avatar-large" style="width: 64px; height: 64px; font-size: 1.5rem; background: ${teacher.avatarColor || '#3B82F6'};">
          ${getInitials(teacher.name)}
        </div>
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.2rem;">${escapeHtml(teacher.name)}</h2>
          <div style="color: var(--accent-cyan); font-weight: 600; font-size: 0.9rem;">${escapeHtml(teacher.designation)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(teacher.dept)} &bull; ${escapeHtml(teacher.location || 'BUET Campus')}</div>
        </div>
        <button id="modalRateTeacherBtn" class="btn-primary" style="white-space: nowrap;">
          ✍️ Write Review
        </button>
      </div>

      <div class="dual-rating-strip" style="padding: 1.25rem; margin-bottom: 1.5rem;">
        <div class="strip-item green" style="padding: 0.75rem;">
          <div style="font-size: 1.7rem; font-weight: 800; color: var(--green-star);">★ ${stats.greenStars.toFixed(1)} / 5.0</div>
          <div class="strip-label" style="font-size: 0.75rem;">Positive Commendation Score</div>
        </div>
        <div class="strip-item red" style="padding: 0.75rem;">
          <div style="font-size: 1.7rem; font-weight: 800; color: var(--red-star);">★ ${stats.redStars.toFixed(1)} / 5.0</div>
          <div class="strip-label" style="font-size: 0.75rem;">Critical Scrutiny Score</div>
        </div>
      </div>

      <div class="reviews-header-bar">
        <h3 style="font-size: 1.1rem; font-weight: 700;">Student Reviews & Comments (${reviews.length})</h3>
        <span style="font-size: 0.8rem; color: var(--text-muted);">Completely Anonymous</span>
      </div>

      <div class="reviews-list">
        ${reviews.length === 0 ? `
          <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: var(--bg-input); border-radius: var(--radius-md);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
            <p>No student reviews posted yet for this teacher.</p>
            <p style="font-size: 0.85rem; margin-top: 0.25rem;">Be the first BUETian to share honest feedback!</p>
          </div>
        ` : reviews.map(r => `
          <div class="review-item">
            <div class="review-top">
              <div class="review-author">
                <span>🛡️ ${escapeHtml(r.author || 'AnonymousBUETian')}</span>
                <span class="review-course-badge">${escapeHtml(r.course || 'Course')}</span>
              </div>
              <span class="review-date">${escapeHtml(r.date || '')}</span>
            </div>

            <div class="review-stars-row">
              <span style="color: var(--green-star); font-size: 0.85rem; font-weight: 700;">
                ★ ${r.greenStars} Green Star${r.greenStars === 1 ? '' : 's'}
              </span>
              <span style="color: var(--text-subtle);">&bull;</span>
              <span style="color: var(--red-star); font-size: 0.85rem; font-weight: 700;">
                ★ ${r.redStars} Red Star${r.redStars === 1 ? '' : 's'}
              </span>
            </div>

            ${(r.tags && r.tags.length) ? `
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                ${r.tags.map(t => `<span style="font-size: 0.7rem; background: rgba(99, 102, 241, 0.15); color: #a5b4fc; padding: 2px 8px; border-radius: 999px;">#${escapeHtml(t)}</span>`).join('')}
              </div>
            ` : ''}

            <div class="review-comment">
              ${escapeHtml(r.comment || 'No written commentary.')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('modalRateTeacherBtn').addEventListener('click', () => {
      triggerReviewFlow(teacher.id);
    });

    openModal(el.teacherModal);
  }

  // Review Flow trigger (with verification check)
  function triggerReviewFlow(teacherId) {
    if (!window.identityManager.isVerified()) {
      state.pendingTeacherIdForReview = teacherId;
      showToast('BUET student verification required before rating', 'info');
      openVerificationModal();
      return;
    }

    openReviewModal(teacherId);
  }

  // Write Review Modal
  function openReviewModal(teacherId) {
    const teacher = state.teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    state.selectedTeacher = teacher;

    el.reviewTeacherName.textContent = `${teacher.name} (${teacher.deptCode || 'BUET'})`;
    state.newReview = {
      greenStars: 5,
      redStars: 1,
      course: `${teacher.deptCode || 'COURSE'} 101`,
      tags: [],
      comment: ''
    };

    el.reviewCourseInput.value = state.newReview.course;
    el.reviewCommentInput.value = '';
    el.reviewCommentCharCount.textContent = '0 / 500';

    setupInteractiveStarPickers();
    setupTagChips();

    openModal(el.reviewModal);
  }

  function setupInteractiveStarPickers() {
    // Green Stars Picker
    renderStarRow(el.greenStarRow, state.newReview.greenStars, 'green', (val) => {
      state.newReview.greenStars = val;
      el.greenStarLabel.textContent = GREEN_LABELS[val];
      renderStarRow(el.greenStarRow, state.newReview.greenStars, 'green');
    }, (hoverVal) => {
      el.greenStarLabel.textContent = GREEN_LABELS[hoverVal];
    }, () => {
      el.greenStarLabel.textContent = GREEN_LABELS[state.newReview.greenStars];
    });
    el.greenStarLabel.textContent = GREEN_LABELS[state.newReview.greenStars];

    // Red Stars Picker
    renderStarRow(el.redStarRow, state.newReview.redStars, 'red', (val) => {
      state.newReview.redStars = val;
      el.redStarLabel.textContent = RED_LABELS[val];
      renderStarRow(el.redStarRow, state.newReview.redStars, 'red');
    }, (hoverVal) => {
      el.redStarLabel.textContent = RED_LABELS[hoverVal];
    }, () => {
      el.redStarLabel.textContent = RED_LABELS[state.newReview.redStars];
    });
    el.redStarLabel.textContent = RED_LABELS[state.newReview.redStars];
  }

  function renderStarRow(container, currentVal, type, onClick, onHover, onLeave) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `star-btn ${i <= currentVal ? 'active' : ''}`;
      btn.innerHTML = '★';
      btn.dataset.val = i;

      if (onClick) {
        btn.addEventListener('click', () => onClick(i));
      }

      if (onHover) {
        btn.addEventListener('mouseenter', () => {
          onHover(i);
          Array.from(container.children).forEach((child, cIdx) => {
            if (cIdx + 1 <= i) child.classList.add('hovered');
            else child.classList.remove('hovered');
          });
        });
      }

      container.appendChild(btn);
    }

    if (onLeave) {
      container.addEventListener('mouseleave', () => {
        Array.from(container.children).forEach(child => child.classList.remove('hovered'));
        onLeave();
      });
    }
  }

  function setupTagChips() {
    const popularTags = [
      'Crystal Clear Lectures', 'Lenient Grading', 'Helpful in Office Hours',
      'Inspiring Mentor', 'Fair Exam Questions', 'Strict Attendance',
      'Pop Quizzes', 'Tough Grading', 'Heavy Assignments', 'Research Oriented'
    ];

    el.tagChipsContainer.innerHTML = popularTags.map(tag => `
      <button type="button" class="tag-chip" data-tag="${escapeHtml(tag)}">+ ${escapeHtml(tag)}</button>
    `).join('');

    el.tagChipsContainer.querySelectorAll('.tag-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (state.newReview.tags.includes(tag)) {
          state.newReview.tags = state.newReview.tags.filter(t => t !== tag);
          btn.classList.remove('selected');
        } else {
          state.newReview.tags.push(tag);
          btn.classList.add('selected');
        }
      });
    });
  }

  // Submit Review Action
  async function submitReview() {
    if (!state.selectedTeacher) return;
    
    const comment = el.reviewCommentInput.value.trim();
    if (comment.length < 5) {
      showToast('Please write a brief comment (at least 5 characters).', 'error');
      return;
    }

    el.reviewSubmitBtn.disabled = true;
    el.reviewSubmitBtn.textContent = 'Submitting...';

    const reviewData = {
      author: window.identityManager.getAlias(),
      course: el.reviewCourseInput.value.trim() || 'General',
      greenStars: state.newReview.greenStars,
      redStars: state.newReview.redStars,
      tags: state.newReview.tags,
      comment: comment
    };

    const res = await window.dbService.addReview(state.selectedTeacher.id, reviewData);
    el.reviewSubmitBtn.disabled = false;
    el.reviewSubmitBtn.textContent = 'Submit Anonymous Review';

    if (res.success) {
      closeModal(el.reviewModal);
      showToast('Review submitted anonymously and ratings updated!', 'success');
      await loadTeachers();
      // Re-open teacher details modal with fresh data
      openTeacherModal(state.selectedTeacher.id);
    } else {
      showToast('Failed to post review. Please try again.', 'error');
    }
  }

  // Verification Gateway Modal
  function openVerificationModal() {
    state.currentQuestion = window.identityManager.getRandomQuestion();
    el.verifyQuestionText.textContent = state.currentQuestion.question;
    el.verifyHint.textContent = `Hint: ${state.currentQuestion.hint}`;
    el.verifyHint.style.display = 'none';
    el.verifyAnswerInput.value = '';
    openModal(el.verifyModal);
  }

  function handleVerificationSubmit() {
    const answer = el.verifyAnswerInput.value.trim();
    if (!answer) {
      showToast('Please enter your answer', 'error');
      return;
    }

    const isCorrect = window.identityManager.validateAnswer(state.currentQuestion.id, answer);
    if (isCorrect) {
      window.identityManager.setVerified(true);
      closeModal(el.verifyModal);
      showToast('BUET student status successfully verified! 🎓', 'success');
      updateIdentityBadge();

      // If they had a pending teacher to review, open it now!
      if (state.pendingTeacherIdForReview) {
        const tid = state.pendingTeacherIdForReview;
        state.pendingTeacherIdForReview = null;
        openReviewModal(tid);
      }
    } else {
      showToast('Incorrect answer. Are you sure you are a BUETian? Check the hint!', 'error');
      el.verifyHint.style.display = 'block';
    }
  }

  // Anonymous Profile & Alias Modal
  function openAliasModal() {
    el.aliasInput.value = window.identityManager.getAlias();
    renderMascotGrid();
    openModal(el.aliasModal);
  }

  function renderMascotGrid() {
    const currentMascot = window.identityManager.getAvatar();
    el.mascotPickerGrid.innerHTML = window.BUET_MASCOTS.map(m => `
      <button type="button" class="mascot-choice-btn ${m === currentMascot ? 'selected' : ''}" data-mascot="${m}">${m}</button>
    `).join('');

    el.mascotPickerGrid.querySelectorAll('.mascot-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.getAttribute('data-mascot');
        window.identityManager.setAvatar(m);
        renderMascotGrid();
        updateIdentityBadge();
      });
    });
  }

  function updateIdentityBadge() {
    el.anonMascot.textContent = window.identityManager.getAvatar();
    el.anonName.textContent = window.identityManager.getAlias();
    const isVer = window.identityManager.isVerified();
    if (isVer) {
      el.anonVerifyStatus.className = 'anon-badge-verified';
      el.anonVerifyStatus.textContent = 'Verified BUETian';
      if (el.heroVerifyBtn) {
        el.heroVerifyBtn.innerHTML = '🛡️ BUETian Verified & Ready';
        el.heroVerifyBtn.style.background = 'linear-gradient(135deg, #059669, #047857)';
      }
    } else {
      el.anonVerifyStatus.className = 'anon-badge-unverified';
      el.anonVerifyStatus.textContent = 'Unverified (Click to Verify)';
    }
  }

  // Firebase Setup Modal
  function openFirebaseModal() {
    const cfg = window.dbService.config || {};
    el.fbApiKey.value = cfg.apiKey || '';
    el.fbProjectId.value = cfg.projectId || '';
    el.fbAuthDomain.value = cfg.authDomain || '';
    el.fbAppId.value = cfg.appId || '';
    openModal(el.firebaseModal);
  }

  async function handleFirebaseSave() {
    const newConfig = {
      apiKey: el.fbApiKey.value.trim(),
      projectId: el.fbProjectId.value.trim(),
      authDomain: el.fbAuthDomain.value.trim(),
      appId: el.fbAppId.value.trim()
    };

    el.fbSaveBtn.disabled = true;
    el.fbSaveBtn.textContent = 'Connecting...';

    const result = await window.dbService.saveConfig(newConfig);
    el.fbSaveBtn.disabled = false;
    el.fbSaveBtn.textContent = 'Save & Connect';

    if (result.success) {
      closeModal(el.firebaseModal);
      showToast('Connected to Firebase Firestore!', 'success');
      updateFirebaseBadge();
      await loadTeachers();
    } else {
      showToast(result.message || 'Firebase connection failed', 'error');
      updateFirebaseBadge();
    }
  }

  function updateFirebaseBadge() {
    if (window.dbService.isFirebaseActive) {
      el.firebaseDot.className = 'status-dot';
      el.firebaseStatusText.textContent = 'Firebase Cloud Live';
    } else {
      el.firebaseDot.className = 'status-dot local';
      el.firebaseStatusText.textContent = 'Local Database (Offline)';
    }
  }

  // Add Teacher Modal
  function openAddTeacherModal() {
    openModal(el.addTeacherModal);
  }

  async function handleAddTeacherSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('newTeacherName').value.trim();
    const deptFull = document.getElementById('newTeacherDept').value.trim();
    const desig = document.getElementById('newTeacherDesig').value;
    const location = document.getElementById('newTeacherLocation').value.trim();

    if (!name) {
      showToast('Please enter faculty name', 'error');
      return;
    }

    // Determine dept code
    const deptMap = {
      'Computer Science and Engineering': 'CSE',
      'Electrical and Electronic Engineering': 'EEE',
      'Civil Engineering': 'CE',
      'Mechanical Engineering': 'ME',
      'Biomedical Engineering': 'BME',
      'Industrial & Production Engineering': 'IPE',
      'Materials and Metallurgical Engineering': 'MME',
      'Nanomaterials and Ceramic Engineering': 'NCE',
      'Naval Architecture and Marine Engineering': 'NAME',
      'Urban and Regional Planning': 'URP',
      'Water Resources Engineering': 'WRE'
    };
    const deptCode = deptMap[deptFull] || 'BUET';

    const newTeacher = await window.dbService.addTeacher({
      name,
      dept: deptFull,
      deptCode,
      designation: desig,
      location: location || 'BUET Campus'
    });

    closeModal(el.addTeacherModal);
    showToast(`Added ${name} to directory!`, 'success');
    document.getElementById('addTeacherForm').reset();
    await loadTeachers();
  }

  // Modal helpers
  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Toast notification
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
    el.toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Event Listeners Setup
  function setupEventListeners() {
    // Identity & Verification
    el.anonPill.addEventListener('click', openAliasModal);
    el.heroVerifyBtn.addEventListener('click', () => {
      if (window.identityManager.isVerified()) {
        showToast('You are already verified as a BUETian!', 'info');
      } else {
        openVerificationModal();
      }
    });
    el.heroSuggestBtn.addEventListener('click', openAddTeacherModal);
    el.firebasePill.addEventListener('click', openFirebaseModal);

    // Verification Modal
    el.verifyCloseBtn.addEventListener('click', () => closeModal(el.verifyModal));
    el.verifySubmitBtn.addEventListener('click', handleVerificationSubmit);
    el.verifyAnswerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleVerificationSubmit();
    });
    el.verifyToggleHintBtn.addEventListener('click', () => {
      el.verifyHint.style.display = el.verifyHint.style.display === 'none' ? 'block' : 'none';
    });

    // Alias Modal
    el.aliasCloseBtn.addEventListener('click', () => closeModal(el.aliasModal));
    el.aliasRerollBtn.addEventListener('click', () => {
      const rolled = window.identityManager.rerollAlias();
      el.aliasInput.value = rolled.alias;
      renderMascotGrid();
      updateIdentityBadge();
    });
    el.aliasSaveBtn.addEventListener('click', () => {
      const newAlias = el.aliasInput.value.trim();
      if (newAlias) {
        window.identityManager.setAlias(newAlias);
        updateIdentityBadge();
        closeModal(el.aliasModal);
        showToast('Anonymous alias updated!', 'success');
      }
    });

    // Teacher Modal
    el.teacherModalCloseBtn.addEventListener('click', () => closeModal(el.teacherModal));

    // Review Modal
    el.reviewModalCloseBtn.addEventListener('click', () => closeModal(el.reviewModal));
    el.reviewSubmitBtn.addEventListener('click', submitReview);
    el.reviewCommentInput.addEventListener('input', () => {
      const len = el.reviewCommentInput.value.length;
      el.reviewCommentCharCount.textContent = `${len} / 500`;
    });

    // Firebase Modal
    el.firebaseCloseBtn.addEventListener('click', () => closeModal(el.firebaseModal));
    el.fbSaveBtn.addEventListener('click', handleFirebaseSave);
    el.fbResetBtn.addEventListener('click', async () => {
      await window.dbService.saveConfig({});
      closeModal(el.firebaseModal);
      showToast('Reverted to Local Storage mode.', 'info');
      updateFirebaseBadge();
    });

    // Add Teacher Modal
    el.addTeacherCloseBtn.addEventListener('click', () => closeModal(el.addTeacherModal));
    el.addTeacherForm.addEventListener('submit', handleAddTeacherSubmit);

    // Search and Filters
    let searchDebounce;
    el.searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.searchQuery = el.searchInput.value;
        applyFilters();
      }, 200);
    });

    el.desigFilter.addEventListener('change', () => {
      state.activeDesig = el.desigFilter.value;
      applyFilters();
    });

    el.sortFilter.addEventListener('change', () => {
      state.sortMode = el.sortFilter.value;
      applyFilters();
    });

    // Department Pills
    el.deptScrollRow.querySelectorAll('.dept-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        el.deptScrollRow.querySelectorAll('.dept-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.activeDept = pill.getAttribute('data-dept');
        applyFilters();
      });
    });

    // Pagination
    el.prevPageBtn.addEventListener('click', () => {
      if (state.page > 1) {
        state.page--;
        renderTeacherGrid();
        window.scrollTo({ top: document.querySelector('.controls-bar').offsetTop - 80, behavior: 'smooth' });
      }
    });

    el.nextPageBtn.addEventListener('click', () => {
      state.page++;
      renderTeacherGrid();
      window.scrollTo({ top: document.querySelector('.controls-bar').offsetTop - 80, behavior: 'smooth' });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay);
      });
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(closeModal);
      }
    });

    // Listen for storage events
    window.addEventListener('buet-identity-change', updateIdentityBadge);
    window.addEventListener('buet-verification-change', updateIdentityBadge);
  }

  // Utilities
  function getInitials(name) {
    if (!name) return 'B';
    const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
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

  // Start app on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
