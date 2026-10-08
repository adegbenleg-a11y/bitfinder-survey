/* ==========================================================================
   BITFINDER SURVEY - CORE APPLICATION LOGIC
   Machine Learning Survey Tool for Bitnox Technology Abeokuta
   Author: Goodness Boluwatife & Antigravity AI
   ========================================================================== */

(function () {
  'use strict';

  // State Management
  const state = {
    currentStep: 0, // 0 = Landing, 1..12 = Questions, 13 = Thank You, -1 = Admin
    answers: {
      age_range: '',
      education_level: '',
      current_status: '',
      tech_experience: '',
      interest_areas: [], // array for multi-select (max 3)
      learning_style: '',
      main_goal: '',
      available_time: '',
      budget_range: '',
      career_path: [], // array for multi-select (max 2)
      course_picked: '',
      achievement_text: ''
    },
    adminAuthenticated: false,
    adminUser: null,
    supabaseUrl: localStorage.getItem('bitfinder_sb_url') || 'https://najwfntqeamtcbqgtfqa.supabase.co',
    supabaseKey: localStorage.getItem('bitfinder_sb_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5handmbnRxZWFtdGNicWd0ZnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTg4OTIsImV4cCI6MjEwNzAzNDg5Mn0.Dq7rIuvj0j7gk0iRyh7xlKzEwC3_WUQPDdY1lR9DgqM',
    supabaseClient: null,
    isSubmitting: false,
    hasSubmitted: sessionStorage.getItem('bitfinder_submitted') === 'true',
    allResponses: [],
    sortColumn: 'submitted_at',
    sortAscending: false
  };

  // List of 12 Questions (Strictly Matched to Database Schema & Constraints)
  const questions = [
    {
      id: 1,
      key: 'age_range',
      category: 'Demographics',
      title: 'What is your age range?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'Under 18', desc: 'Secondary school student / Teenager', icon: 'user' },
        { label: '18-24', desc: 'Tertiary student / Young adult', icon: 'user-check' },
        { label: '25-34', desc: 'Career starter / Young professional', icon: 'briefcase' },
        { label: '35+', desc: 'Experienced adult / Career upgrader', icon: 'award' }
      ]
    },
    {
      id: 2,
      key: 'education_level',
      category: 'Education Background',
      title: 'What is your highest level of education?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'SSCE', desc: 'Senior Secondary Certificate Examination', icon: 'graduation-cap' },
        { label: 'OND/HND', desc: 'Ordinary / Higher National Diploma', icon: 'award' },
        { label: 'Undergraduate', desc: 'Currently studying at University/Polytechnic', icon: 'book-open' },
        { label: 'Graduate', desc: 'Bachelor Degree or Master Degree completed', icon: 'scroll' }
      ]
    },
    {
      id: 3,
      key: 'current_status',
      category: 'Current Status',
      title: 'What is your current occupational status?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'Student', desc: 'Full-time or part-time student', icon: 'book' },
        { label: 'Employed', desc: 'Working for a company / organization', icon: 'building-2' },
        { label: 'Self-employed', desc: 'Running own business or solo freelancing', icon: 'sparkles' },
        { label: 'Unemployed', desc: 'Currently looking for opportunities', icon: 'search' }
      ]
    },
    {
      id: 4,
      key: 'tech_experience',
      category: 'Tech Background',
      title: 'How would you rate your tech experience level?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'None', desc: 'Complete beginner, starting fresh', icon: 'sprout' },
        { label: 'Basic', desc: 'Know computer basics, use everyday web apps', icon: 'laptop' },
        { label: 'Intermediate', desc: 'Some experience in coding, design, or hardware', icon: 'code-2' }
      ]
    },
    {
      id: 5,
      key: 'interest_areas',
      category: 'Interests & Passions',
      title: 'Which tech areas interest you most?',
      hint: 'Tick up to 3 areas (Max 3 choices)',
      type: 'multi',
      maxSelect: 3,
      minSelect: 1,
      options: [
        { label: 'Design', desc: 'UI/UX, graphics & product interfaces', icon: 'palette' },
        { label: 'Coding', desc: 'Web, mobile & software programming', icon: 'terminal' },
        { label: 'Hardware/Phones', desc: 'Electronics, phone repair & gadgets', icon: 'smartphone' },
        { label: 'Networking', desc: 'Cybersecurity, servers & connectivity', icon: 'network' },
        { label: 'Data', desc: 'Machine Learning, AI & data analytics', icon: 'database' },
        { label: 'Business', desc: 'Digital marketing, startup growth & sales', icon: 'trending-up' },
        { label: 'Content/Video', desc: 'Media creation, editing & digital story', icon: 'video' }
      ]
    },
    {
      id: 6,
      key: 'learning_style',
      category: 'Learning Style',
      title: 'What is your preferred learning style?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'Practical', desc: 'Hands-on building & practical projects', icon: 'hammer' },
        { label: 'Mix of both', desc: 'Balanced theory with real practice', icon: 'layers' },
        { label: 'Theory', desc: 'Structured reading, concepts & lectures', icon: 'book-text' }
      ]
    },
    {
      id: 7,
      key: 'main_goal',
      category: 'Primary Objective',
      title: 'What is your main goal for studying tech at Bitnox?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'Get a job', desc: 'Land a local or remote tech job', icon: 'briefcase' },
        { label: 'Freelance', desc: 'Offer tech services on Upwork/Fiverr', icon: 'globe' },
        { label: 'Start a business', desc: 'Build a startup or local tech agency', icon: 'rocket' },
        { label: 'School project', desc: 'Academic requirement / final project', icon: 'file-text' },
        { label: 'Just curious', desc: 'Explore new knowledge and skills', icon: 'compass' }
      ]
    },
    {
      id: 8,
      key: 'available_time',
      category: 'Schedule',
      title: 'When are you available to attend classes?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'Weekdays', desc: 'Monday to Friday schedule', icon: 'calendar-days' },
        { label: 'Weekends', desc: 'Saturday & Sunday intensive schedule', icon: 'calendar-range' },
        { label: 'Flexible', desc: 'Self-paced / adaptable schedule', icon: 'clock' }
      ]
    },
    {
      id: 9,
      key: 'budget_range',
      category: 'Course Investment',
      title: 'What is your budget range for tech training?',
      hint: 'Choose one option',
      type: 'single',
      options: [
        { label: 'Under ₦100,000', desc: 'Starter & foundational courses', icon: 'coins' },
        { label: '₦150,000 - ₦200,000', desc: 'Standard practical course', icon: 'wallet' },
        { label: '₦300,000 - ₦400,000', desc: 'Comprehensive multi-month track', icon: 'credit-card' },
        { label: 'Above ₦500,000', desc: 'Full career mastery track', icon: 'banknote' }
      ]
    },
    {
      id: 10,
      key: 'career_path',
      category: 'Career Path',
      title: 'Which preferred career path(s) appeal to you?',
      hint: 'Tick 1 or 2 options (Max 2 choices)',
      type: 'multi',
      maxSelect: 2,
      minSelect: 1,
      options: [
        { label: 'Tech employee', desc: 'Corporate or tech startup team member', icon: 'building' },
        { label: 'Freelancer', desc: 'Independent contractor / client work', icon: 'laptop' },
        { label: 'Entrepreneur', desc: 'Founder of a tech business', icon: 'zap' },
        { label: 'Further studies', desc: 'Academic advancement / Master degree', icon: 'graduation-cap' }
      ]
    },
    {
      id: 11,
      key: 'course_picked',
      category: 'Bitnox Curriculum',
      title: 'Which course are you currently enrolled in or interested in?',
      hint: 'Choose one course from the Bitnox curriculum',
      type: 'single_grouped',
      groups: [
        {
          name: 'Software Development',
          options: [
            { label: 'Frontend Development (JavaScript)', icon: 'layout' },
            { label: 'Backend Development (JavaScript)', icon: 'server' },
            { label: 'Backend Development (Python)', icon: 'file-code-2' },
            { label: 'Python Mastery', icon: 'code' },
            { label: 'Mobile App Development', icon: 'smartphone' }
          ]
        },
        {
          name: 'AI & Data Science',
          options: [
            { label: 'Machine Learning', icon: 'brain' },
            { label: 'Data Analytics', icon: 'pie-chart' },
            { label: 'Prompt Engineering', icon: 'message-square-code' },
            { label: 'Generative AI Mastery', icon: 'sparkles' },
            { label: 'AI Automation', icon: 'bot' }
          ]
        },
        {
          name: 'IT & Security',
          options: [
            { label: 'Cybersecurity', icon: 'shield-check' }
          ]
        },
        {
          name: 'Design & Marketing',
          options: [
            { label: 'Product Design', icon: 'figma' },
            { label: 'Digital Marketing', icon: 'megaphone' },
            { label: 'Digital Literacy', icon: 'book-open' }
          ]
        },
        {
          name: 'Language & General',
          options: [
            { label: 'ESL Tutoring', icon: 'languages' },
            { label: 'Not decided yet', icon: 'help-circle' }
          ]
        }
      ]
    },
    {
      id: 12,
      key: 'achievement_text',
      category: 'Personal Vision',
      title: 'What do you want to achieve with tech?',
      hint: 'Write 1-2 sentences explaining your target outcome (20 to 300 characters)',
      type: 'text',
      minChars: 20,
      maxChars: 300
    }
  ];

  // DOM Element Selectors
  const DOM = {
    // Screens
    landingScreen: document.getElementById('landing-screen'),
    questionScreen: document.getElementById('question-screen'),
    thankyouScreen: document.getElementById('thankyou-screen'),
    adminScreen: document.getElementById('admin-screen'),

    // Toast Banner
    toastBanner: document.getElementById('toast-banner'),
    toastIcon: document.getElementById('toast-icon'),
    toastMessage: document.getElementById('toast-message'),
    toastCloseBtn: document.getElementById('toast-close-btn'),

    // Landing Screen Controls
    startBtn: document.getElementById('start-btn'),
    adminTriggerBtn: document.getElementById('admin-trigger-btn'),

    // Question Controls
    questionCounter: document.getElementById('question-counter'),
    percentText: document.getElementById('percent-text'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    questionCategory: document.getElementById('question-category'),
    questionTitle: document.getElementById('question-title'),
    questionHint: document.getElementById('question-hint'),
    optionsContainer: document.getElementById('options-container'),
    textInputContainer: document.getElementById('text-input-container'),
    achievementTextarea: document.getElementById('achievement-textarea'),
    charCounter: document.getElementById('char-counter'),
    charStatus: document.getElementById('char-status'),
    backBtn: document.getElementById('back-btn'),
    nextBtn: document.getElementById('next-btn'),
    nextBtnText: document.getElementById('next-btn-text'),
    nextBtnIcon: document.getElementById('next-btn-icon'),
    hpField: document.getElementById('hp_field'),

    // Thank You Screen Controls
    qrCodeDisplay: document.getElementById('qr-code-display'),
    copyLinkBtn: document.getElementById('copy-link-btn'),
    copyBtnText: document.getElementById('copy-btn-text'),
    viewAdminBtn: document.getElementById('view-admin-btn'),
    restartBtn: document.getElementById('restart-btn'),

    // Admin Controls
    adminAuthBox: document.getElementById('admin-auth-box'),
    adminLoginForm: document.getElementById('admin-login-form'),
    adminEmailInput: document.getElementById('admin-email-input'),
    adminPassInput: document.getElementById('admin-pass-input'),
    adminLoginBtn: document.getElementById('admin-login-btn'),
    authErrorMsg: document.getElementById('auth-error-msg'),
    authErrorText: document.getElementById('auth-error-text'),
    adminCancelBtn: document.getElementById('admin-cancel-btn'),
    adminContentBox: document.getElementById('admin-content-box'),
    adminUserBadge: document.getElementById('admin-user-badge'),
    adminLogoutBtn: document.getElementById('admin-logout-btn'),
    closeAdminBtn: document.getElementById('close-admin-btn'),

    // Admin Dashboard Stats & Breakdown
    statTotalCount: document.getElementById('stat-total-count'),
    statTodayCount: document.getElementById('stat-today-count'),
    statTopCourse: document.getElementById('stat-top-course'),
    statTopInterest: document.getElementById('stat-top-interest'),
    courseBreakdownList: document.getElementById('course-breakdown-list'),
    interestBreakdownList: document.getElementById('interest-breakdown-list'),
    dailyBreakdownList: document.getElementById('daily-breakdown-list'),

    // Admin Table Controls
    adminSearchInput: document.getElementById('admin-search-input'),
    supabaseConfigBtn: document.getElementById('supabase-config-btn'),
    downloadCsvBtn: document.getElementById('download-csv-btn'),
    responsesTableBody: document.getElementById('responses-table-body'),
    tableEmptyMsg: document.getElementById('table-empty-msg'),

    // Supabase Modal
    supabaseModal: document.getElementById('supabase-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    sbUrlInput: document.getElementById('sb-url-input'),
    sbKeyInput: document.getElementById('sb-key-input'),
    testSbBtn: document.getElementById('test-sb-btn'),
    saveSbBtn: document.getElementById('save-sb-btn')
  };

  // Initialize Application
  function init() {
    setupSupabaseClient();
    bindEvents();
    renderQRCode();
    checkExistingSession();

    // Check URL route hash for #admin
    if (window.location.hash === '#admin') {
      showScreen(DOM.adminScreen);
    }
  }

  // Toast Notification Helper
  function showToast(message, isError = true) {
    if (!DOM.toastBanner) return;
    DOM.toastMessage.textContent = message;
    if (isError) {
      DOM.toastBanner.className = 'toast-banner toast-error';
    } else {
      DOM.toastBanner.className = 'toast-banner toast-success';
    }
    DOM.toastBanner.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  function hideToast() {
    if (DOM.toastBanner) DOM.toastBanner.classList.add('hidden');
  }

  // Supabase Client Setup
  function setupSupabaseClient() {
    if (state.supabaseUrl && state.supabaseKey && window.supabase) {
      try {
        state.supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
      } catch (err) {
        console.warn('Supabase init failed:', err);
      }
    }
  }

  // Check Active Supabase Auth Session
  async function checkExistingSession() {
    if (state.supabaseClient) {
      try {
        const { data: { session } } = await state.supabaseClient.auth.getSession();
        if (session && session.user) {
          state.adminAuthenticated = true;
          state.adminUser = session.user;
          DOM.adminUserBadge.innerHTML = `<i data-lucide="user-check"></i> ${session.user.email}`;
          DOM.adminAuthBox.classList.add('hidden');
          DOM.adminContentBox.classList.remove('hidden');
          loadAdminDashboardData();
        }
      } catch (e) {
        console.log('No existing session:', e);
      }
    }
  }

  // Event Listeners Binding
  function bindEvents() {
    if (DOM.toastCloseBtn) {
      DOM.toastCloseBtn.addEventListener('click', hideToast);
    }

    DOM.startBtn.addEventListener('click', () => {
      state.currentStep = 1;
      showScreen(DOM.questionScreen);
      renderQuestion();
    });

    DOM.adminTriggerBtn.addEventListener('click', () => {
      showScreen(DOM.adminScreen);
    });

    DOM.backBtn.addEventListener('click', handleBack);
    DOM.nextBtn.addEventListener('click', handleNext);

    DOM.achievementTextarea.addEventListener('input', handleTextareaInput);

    DOM.copyLinkBtn.addEventListener('click', handleCopyLink);
    DOM.viewAdminBtn.addEventListener('click', () => showScreen(DOM.adminScreen));
    DOM.restartBtn.addEventListener('click', handleRestart);

    // Admin Auth Form (Supabase Auth Login)
    DOM.adminLoginForm.addEventListener('submit', handleAdminLogin);

    DOM.adminCancelBtn.addEventListener('click', () => {
      showScreen(DOM.landingScreen);
    });

    DOM.adminLogoutBtn.addEventListener('click', async () => {
      if (state.supabaseClient) {
        await state.supabaseClient.auth.signOut();
      }
      state.adminAuthenticated = false;
      state.adminUser = null;
      DOM.adminEmailInput.value = '';
      DOM.adminPassInput.value = '';
      DOM.adminAuthBox.classList.remove('hidden');
      DOM.adminContentBox.classList.add('hidden');
      showScreen(DOM.landingScreen);
    });

    DOM.closeAdminBtn.addEventListener('click', () => {
      showScreen(DOM.landingScreen);
    });

    DOM.adminSearchInput.addEventListener('input', () => {
      renderTableRows(getFilteredResponses());
    });

    DOM.downloadCsvBtn.addEventListener('click', exportCSV);

    // Sorting headers listener
    document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (state.sortColumn === col) {
          state.sortAscending = !state.sortAscending;
        } else {
          state.sortColumn = col;
          state.sortAscending = true;
        }
        renderTableRows(getFilteredResponses());
      });
    });

    // Supabase Modal Events
    DOM.supabaseConfigBtn.addEventListener('click', () => {
      DOM.sbUrlInput.value = state.supabaseUrl;
      DOM.sbKeyInput.value = state.supabaseKey;
      DOM.supabaseModal.classList.remove('hidden');
    });

    DOM.closeModalBtn.addEventListener('click', () => {
      DOM.supabaseModal.classList.add('hidden');
    });

    DOM.saveSbBtn.addEventListener('click', () => {
      state.supabaseUrl = DOM.sbUrlInput.value.trim();
      state.supabaseKey = DOM.sbKeyInput.value.trim();
      localStorage.setItem('bitfinder_sb_url', state.supabaseUrl);
      localStorage.setItem('bitfinder_sb_key', state.supabaseKey);
      setupSupabaseClient();
      DOM.supabaseModal.classList.add('hidden');
      showToast('Supabase credentials saved successfully!', false);
    });

    DOM.testSbBtn.addEventListener('click', async () => {
      const tempUrl = DOM.sbUrlInput.value.trim();
      const tempKey = DOM.sbKeyInput.value.trim();
      if (!tempUrl || !tempKey) {
        alert('Please enter both Supabase URL and Key.');
        return;
      }
      try {
        const tempClient = window.supabase.createClient(tempUrl, tempKey);
        const { error } = await tempClient.from('survey_responses').select('id').limit(1);
        if (error && error.code !== 'PGRST116') {
          alert('Supabase connection note: ' + error.message);
        } else {
          alert('Success! Connected to Supabase project table survey_responses.');
        }
      } catch (err) {
        alert('Connection test failed: ' + err.message);
      }
    });
  }

  // Handle Admin Login with Supabase Auth
  async function handleAdminLogin(e) {
    e.preventDefault();
    hideToast();

    const email = DOM.adminEmailInput.value.trim();
    const password = DOM.adminPassInput.value.trim();

    if (!email || !password) {
      DOM.authErrorText.textContent = 'Please enter both email and password.';
      DOM.authErrorMsg.classList.remove('hidden');
      return;
    }

    if (!state.supabaseClient) {
      DOM.authErrorText.textContent = 'Supabase client is not configured yet. Click "Supabase Setup" or check environment keys.';
      DOM.authErrorMsg.classList.remove('hidden');
      return;
    }

    try {
      DOM.adminLoginBtn.disabled = true;
      DOM.adminLoginBtn.querySelector('span').textContent = 'Authenticating...';

      const { data, error } = await state.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      DOM.adminLoginBtn.disabled = false;
      DOM.adminLoginBtn.querySelector('span').textContent = 'Sign In as Admin';

      if (error) {
        DOM.authErrorText.textContent = error.message || 'Invalid admin credentials.';
        DOM.authErrorMsg.classList.remove('hidden');
      } else if (data.user) {
        state.adminAuthenticated = true;
        state.adminUser = data.user;
        DOM.adminUserBadge.innerHTML = `<i data-lucide="user-check"></i> ${data.user.email}`;
        DOM.adminAuthBox.classList.add('hidden');
        DOM.adminContentBox.classList.remove('hidden');
        DOM.authErrorMsg.classList.add('hidden');
        loadAdminDashboardData();
      }
    } catch (err) {
      DOM.adminLoginBtn.disabled = false;
      DOM.adminLoginBtn.querySelector('span').textContent = 'Sign In as Admin';
      DOM.authErrorText.textContent = err.message || 'Authentication error occurred.';
      DOM.authErrorMsg.classList.remove('hidden');
    }
  }

  // Screen Switcher
  function showScreen(screenEl) {
    [DOM.landingScreen, DOM.questionScreen, DOM.thankyouScreen, DOM.adminScreen].forEach(s => {
      s.classList.remove('active');
    });
    screenEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Render Current Question
  function renderQuestion() {
    const q = questions[state.currentStep - 1];
    if (!q) return;

    // Update Progress Bar
    const progressPercent = Math.round((state.currentStep / questions.length) * 100);
    DOM.questionCounter.textContent = `Question ${state.currentStep} of ${questions.length}`;
    DOM.percentText.textContent = `${progressPercent}%`;
    DOM.progressBarFill.style.width = `${progressPercent}%`;

    // Header Content
    DOM.questionCategory.textContent = q.category;
    DOM.questionTitle.textContent = q.title;
    DOM.questionHint.textContent = q.hint;

    // Reset Containers
    DOM.optionsContainer.innerHTML = '';
    DOM.optionsContainer.className = 'options-grid';
    DOM.optionsContainer.classList.remove('hidden');
    DOM.textInputContainer.classList.add('hidden');

    // Back Button State
    DOM.backBtn.disabled = state.currentStep === 1;

    // Render Options or Text Area
    if (q.type === 'single' || q.type === 'multi') {
      renderStandardOptions(q);
    } else if (q.type === 'single_grouped') {
      renderGroupedOptions(q);
    } else if (q.type === 'text') {
      renderTextAreaInput(q);
    }

    // Update Next Button State
    validateCurrentQuestion();

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Render Standard Options Cards
  function renderStandardOptions(q) {
    const currentVal = state.answers[q.key];

    q.options.forEach(opt => {
      const card = document.createElement('div');
      card.className = 'option-card';
      
      let isSelected = false;
      if (q.type === 'single') {
        isSelected = currentVal === opt.label;
      } else if (q.type === 'multi') {
        isSelected = Array.isArray(currentVal) && currentVal.includes(opt.label);
      }

      if (isSelected) card.classList.add('selected');

      card.innerHTML = `
        <div class="option-left">
          <div class="option-icon">
            <i data-lucide="${opt.icon || 'circle'}"></i>
          </div>
          <div class="option-text-wrapper">
            <span class="option-label">${opt.label}</span>
            ${opt.desc ? `<span class="option-desc">${opt.desc}</span>` : ''}
          </div>
        </div>
        <div class="option-check">
          <i data-lucide="check"></i>
        </div>
      `;

      card.addEventListener('click', () => {
        if (q.type === 'single') {
          state.answers[q.key] = opt.label;
        } else if (q.type === 'multi') {
          let list = Array.isArray(state.answers[q.key]) ? [...state.answers[q.key]] : [];
          if (list.includes(opt.label)) {
            list = list.filter(item => item !== opt.label);
          } else {
            if (list.length < q.maxSelect) {
              list.push(opt.label);
            }
          }
          state.answers[q.key] = list;
        }
        renderQuestion();
      });

      DOM.optionsContainer.appendChild(card);
    });
  }

  // Render Grouped Options Cards (For Course Picked)
  function renderGroupedOptions(q) {
    DOM.optionsContainer.classList.add('grid-layout');
    const currentVal = state.answers[q.key];

    q.groups.forEach(group => {
      const catHeader = document.createElement('div');
      catHeader.className = 'category-header';
      catHeader.textContent = group.name;
      DOM.optionsContainer.appendChild(catHeader);

      group.options.forEach(opt => {
        const card = document.createElement('div');
        card.className = 'option-card';
        const isSelected = currentVal === opt.label;
        if (isSelected) card.classList.add('selected');

        card.innerHTML = `
          <div class="option-left">
            <div class="option-icon">
              <i data-lucide="${opt.icon || 'book'}"></i>
            </div>
            <div class="option-text-wrapper">
              <span class="option-label">${opt.label}</span>
            </div>
          </div>
          <div class="option-check">
            <i data-lucide="check"></i>
          </div>
        `;

        card.addEventListener('click', () => {
          state.answers[q.key] = opt.label;
          renderQuestion();
        });

        DOM.optionsContainer.appendChild(card);
      });
    });
  }

  // Render Text Area Input (Q12)
  function renderTextAreaInput(q) {
    DOM.optionsContainer.classList.add('hidden');
    DOM.textInputContainer.classList.remove('hidden');

    DOM.achievementTextarea.value = state.answers.achievement_text || '';
    updateCharCounter();
  }

  // Handle Textarea Input
  function handleTextareaInput(e) {
    state.answers.achievement_text = e.target.value;
    updateCharCounter();
    validateCurrentQuestion();
  }

  // Character Counter Update for Q12
  function updateCharCounter() {
    const text = state.answers.achievement_text || '';
    const len = text.trim().length;

    DOM.charCounter.textContent = `${len} / 300 characters`;

    if (len >= 20 && len <= 300) {
      DOM.charCounter.classList.add('valid');
      DOM.charStatus.className = 'char-status valid';
      DOM.charStatus.innerHTML = '<i data-lucide="check-circle-2"></i> Valid response';
    } else if (len < 20) {
      DOM.charCounter.classList.remove('valid');
      DOM.charStatus.className = 'char-status invalid';
      DOM.charStatus.innerHTML = `<i data-lucide="alert-circle"></i> Need ${20 - len} more characters`;
    } else {
      DOM.charCounter.classList.remove('valid');
      DOM.charStatus.className = 'char-status invalid';
      DOM.charStatus.innerHTML = '<i data-lucide="alert-circle"></i> Exceeds 300 characters limit';
    }

    if (window.lucide) lucide.createIcons();
  }

  // Validate Current Question & Control Next Button State
  function validateCurrentQuestion() {
    const q = questions[state.currentStep - 1];
    let isValid = false;

    if (!q) return;

    if (q.type === 'single' || q.type === 'single_grouped') {
      isValid = Boolean(state.answers[q.key]);
    } else if (q.type === 'multi') {
      const arr = state.answers[q.key];
      isValid = Array.isArray(arr) && arr.length >= (q.minSelect || 1) && arr.length <= q.maxSelect;
    } else if (q.type === 'text') {
      const len = (state.answers.achievement_text || '').trim().length;
      isValid = len >= q.minChars && len <= q.maxChars;
    }

    DOM.nextBtn.disabled = !isValid;

    if (state.currentStep === questions.length) {
      DOM.nextBtnText.textContent = 'Submit Survey';
      DOM.nextBtnIcon.setAttribute('data-lucide', 'send');
    } else {
      DOM.nextBtnText.textContent = 'Next';
      DOM.nextBtnIcon.setAttribute('data-lucide', 'chevron-right');
    }
  }

  // Handle Back Navigation
  function handleBack() {
    if (state.currentStep > 1) {
      state.currentStep--;
      renderQuestion();
    }
  }

  // Handle Next / Submit Navigation
  async function handleNext() {
    if (state.currentStep < questions.length) {
      state.currentStep++;
      renderQuestion();
    } else {
      await submitSurvey();
    }
  }

  // Submit Survey to Server API / Supabase
  async function submitSurvey() {
    if (state.isSubmitting || state.hasSubmitted) return;

    hideToast();
    state.isSubmitting = true;
    DOM.nextBtn.disabled = true;
    DOM.nextBtnText.textContent = 'Submitting...';

    // 1. Client-Side Spam / Honeypot Check
    const hpVal = DOM.hpField ? DOM.hpField.value.trim() : '';
    if (hpVal !== '') {
      showToast('Submission rejected due to spam detection.');
      state.isSubmitting = false;
      validateCurrentQuestion();
      return;
    }

    // 2. Client-Side Browser Rate Guard (Limit 1 submission per browser per hour)
    const lastSubmitTime = localStorage.getItem('bitfinder_last_submit');
    const now = Date.now();
    if (lastSubmitTime && (now - parseInt(lastSubmitTime, 10)) < 3600000) {
      const minutesLeft = Math.ceil((3600000 - (now - parseInt(lastSubmitTime, 10))) / 60000);
      showToast(`You have already submitted a survey recently. Please wait ${minutesLeft} minutes before submitting another.`);
      state.isSubmitting = false;
      validateCurrentQuestion();
      return;
    }

    // Format Data Payload according to exact required column names:
    const payload = {
      age_range: state.answers.age_range,
      education_level: state.answers.education_level,
      current_status: state.answers.current_status,
      tech_experience: state.answers.tech_experience,
      interest_areas: state.answers.interest_areas, // Array of strings
      learning_style: state.answers.learning_style,
      main_goal: state.answers.main_goal,
      available_time: state.answers.available_time,
      budget_range: state.answers.budget_range,
      career_path: state.answers.career_path, // Array of strings
      course_picked: state.answers.course_picked,
      achievement_text: state.answers.achievement_text,
      hp_field: hpVal
    };

    let submitSuccess = false;

    // A. Submit via Backend Server Endpoint `/api/submit`
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        submitSuccess = true;
      } else {
        console.warn('Backend endpoint returned error:', result.error);
        // Fallback B: If local/standalone client with direct Supabase configuration
        if (state.supabaseClient) {
          submitSuccess = await submitDirectToSupabase(payload);
        } else {
          showToast(result.error || 'Submission failed. Please check your answers and try again.');
        }
      }
    } catch (fetchErr) {
      console.warn('Backend server endpoint unreachable, trying direct Supabase client...', fetchErr);
      // Fallback B: Direct Supabase client insertion if API endpoint is unhosted
      if (state.supabaseClient) {
        submitSuccess = await submitDirectToSupabase(payload);
      } else {
        showToast('Network error while connecting to server. Your answers are saved, please click Submit again to retry.');
      }
    }

    if (submitSuccess) {
      localStorage.setItem('bitfinder_last_submit', Date.now().toString());
      state.hasSubmitted = true;
      sessionStorage.setItem('bitfinder_submitted', 'true');
      state.isSubmitting = false;
      showScreen(DOM.thankyouScreen);
    } else {
      // Keep student's answers in state.answers so they lose NOTHING!
      state.isSubmitting = false;
      validateCurrentQuestion();
    }
  }

  // Fallback Direct Supabase Insert
  async function submitDirectToSupabase(payload) {
    try {
      const dbPayload = {
        ...payload,
        submitted_at: new Date().toISOString()
      };
      delete dbPayload.hp_field;

      const { error } = await state.supabaseClient.from('survey_responses').insert([dbPayload]);
      if (error) {
        showToast(`Database error: ${error.message}. Please retry.`);
        return false;
      }
      return true;
    } catch (e) {
      showToast('Database connection failed. Please try again.');
      return false;
    }
  }

  // Restart Survey for Another Response
  function handleRestart() {
    sessionStorage.removeItem('bitfinder_submitted');
    state.hasSubmitted = false;
    state.currentStep = 1;
    // Reset answers
    state.answers = {
      age_range: '',
      education_level: '',
      current_status: '',
      tech_experience: '',
      interest_areas: [],
      learning_style: '',
      main_goal: '',
      available_time: '',
      budget_range: '',
      career_path: [],
      course_picked: '',
      achievement_text: ''
    };
    hideToast();
    showScreen(DOM.questionScreen);
    renderQuestion();
  }

  // Load Admin Dashboard Data
  async function loadAdminDashboardData() {
    let responses = [];

    // Fetch from Supabase as Authenticated Admin
    if (state.supabaseClient) {
      try {
        const { data, error } = await state.supabaseClient
          .from('survey_responses')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error('Supabase fetch error:', error);
          showToast(`Admin data fetch note: ${error.message}`);
        } else if (data) {
          responses = data;
        }
      } catch (err) {
        console.warn('Could not fetch from Supabase admin:', err);
      }
    }

    state.allResponses = responses;
    updateAdminMetrics(responses);
    renderTableRows(getFilteredResponses());
  }

  // Update Metrics & Breakdown Visualizations
  function updateAdminMetrics(responses) {
    DOM.statTotalCount.textContent = responses.length;

    const todayStr = new Date().toISOString().slice(0, 10);
    let todayCount = 0;
    const courseCounts = {};
    const interestCounts = {};
    const dailyCounts = {};

    responses.forEach(r => {
      // Today count
      const rDate = r.submitted_at ? r.submitted_at.slice(0, 10) : '';
      if (rDate === todayStr) todayCount++;

      // Daily breakdown
      if (rDate) {
        dailyCounts[rDate] = (dailyCounts[rDate] || 0) + 1;
      }

      // Course picked breakdown
      if (r.course_picked) {
        courseCounts[r.course_picked] = (courseCounts[r.course_picked] || 0) + 1;
      }

      // Interest areas breakdown (un-nest arrays)
      let interests = [];
      if (Array.isArray(r.interest_areas)) {
        interests = r.interest_areas;
      } else if (typeof r.interest_areas === 'string') {
        interests = r.interest_areas.split(';').map(s => s.trim()).filter(Boolean);
      }
      interests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });

    DOM.statTodayCount.textContent = todayCount;

    // Top Course Picked
    const topCourse = Object.keys(courseCounts).length > 0
      ? Object.keys(courseCounts).reduce((a, b) => courseCounts[a] > courseCounts[b] ? a : b)
      : 'N/A';
    DOM.statTopCourse.textContent = topCourse;

    // Top Interest Area
    const topInterest = Object.keys(interestCounts).length > 0
      ? Object.keys(interestCounts).reduce((a, b) => interestCounts[a] > interestCounts[b] ? a : b)
      : 'N/A';
    DOM.statTopInterest.textContent = topInterest;

    // Render Breakdown Lists
    renderBreakdownList(DOM.courseBreakdownList, courseCounts, responses.length);
    renderBreakdownList(DOM.interestBreakdownList, interestCounts, responses.length);
    renderBreakdownList(DOM.dailyBreakdownList, dailyCounts, responses.length, true);
  }

  // Render Visual Progress Bars for Metrics
  function renderBreakdownList(containerEl, countsObj, total, isDate = false) {
    if (!containerEl) return;
    containerEl.innerHTML = '';

    const keys = Object.keys(countsObj).sort((a, b) => isDate ? b.localeCompare(a) : countsObj[b] - countsObj[a]);

    if (keys.length === 0) {
      containerEl.innerHTML = '<span class="breakdown-empty">No data available</span>';
      return;
    }

    keys.forEach(key => {
      const count = countsObj[key];
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'breakdown-item';
      item.innerHTML = `
        <div class="breakdown-info">
          <span class="breakdown-name">${key}</span>
          <span class="breakdown-val">${count} (${pct}%)</span>
        </div>
        <div class="breakdown-bar-bg">
          <div class="breakdown-bar-fill" style="width: ${pct}%;"></div>
        </div>
      `;
      containerEl.appendChild(item);
    });
  }

  // Filter Responses by Search Keyword
  function getFilteredResponses() {
    const list = state.allResponses || [];
    const query = (DOM.adminSearchInput.value || '').toLowerCase().trim();

    let filtered = list;
    if (query) {
      filtered = list.filter(r => {
        const interestStr = Array.isArray(r.interest_areas) ? r.interest_areas.join(' ') : (r.interest_areas || '');
        const careerStr = Array.isArray(r.career_path) ? r.career_path.join(' ') : (r.career_path || '');
        return (
          (r.course_picked || '').toLowerCase().includes(query) ||
          (r.main_goal || '').toLowerCase().includes(query) ||
          (r.current_status || '').toLowerCase().includes(query) ||
          (r.achievement_text || '').toLowerCase().includes(query) ||
          interestStr.toLowerCase().includes(query) ||
          careerStr.toLowerCase().includes(query)
        );
      });
    }

    // Apply Sorting
    return filtered.sort((a, b) => {
      let valA = a[state.sortColumn] || '';
      let valB = b[state.sortColumn] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return state.sortAscending ? -1 : 1;
      if (valA > valB) return state.sortAscending ? 1 : -1;
      return 0;
    });
  }

  // Render Data Table Rows with Delete Option
  function renderTableRows(rows) {
    DOM.responsesTableBody.innerHTML = '';

    if (!rows || rows.length === 0) {
      DOM.tableEmptyMsg.classList.remove('hidden');
      return;
    } else {
      DOM.tableEmptyMsg.classList.add('hidden');
    }

    rows.forEach((r, idx) => {
      const tr = document.createElement('tr');
      const dateStr = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() + ' ' + new Date(r.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

      const interestStr = Array.isArray(r.interest_areas) ? r.interest_areas.join('; ') : (r.interest_areas || '-');
      const careerStr = Array.isArray(r.career_path) ? r.career_path.join('; ') : (r.career_path || '-');

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>
          <button class="btn btn-danger btn-xs delete-row-btn" data-id="${r.id}" title="Delete Response">
            <i data-lucide="trash-2"></i> Delete
          </button>
        </td>
        <td>${dateStr}</td>
        <td>${r.age_range || '-'}</td>
        <td>${r.education_level || '-'}</td>
        <td>${r.current_status || '-'}</td>
        <td>${r.tech_experience || '-'}</td>
        <td>${interestStr}</td>
        <td>${r.learning_style || '-'}</td>
        <td>${r.main_goal || '-'}</td>
        <td>${r.available_time || '-'}</td>
        <td>${r.budget_range || '-'}</td>
        <td>${careerStr}</td>
        <td><strong>${r.course_picked || '-'}</strong></td>
        <td>${r.achievement_text || '-'}</td>
      `;

      // Attach Delete Listener
      const delBtn = tr.querySelector('.delete-row-btn');
      delBtn.addEventListener('click', () => handleDeleteRow(r.id, r.course_picked));

      DOM.responsesTableBody.appendChild(tr);
    });

    if (window.lucide) lucide.createIcons();
  }

  // Delete Individual Response Row
  async function handleDeleteRow(rowId, courseName) {
    if (!rowId) return;

    const confirmed = confirm(`Are you sure you want to delete this response for "${courseName || 'Selected Course'}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    if (state.supabaseClient) {
      try {
        const { error } = await state.supabaseClient
          .from('survey_responses')
          .delete()
          .eq('id', rowId);

        if (error) {
          alert('Delete failed: ' + error.message);
        } else {
          showToast('Response deleted successfully.', false);
          loadAdminDashboardData();
        }
      } catch (err) {
        alert('Delete error: ' + err.message);
      }
    }
  }

  // Export Responses as CSV for Google Colab / Pandas
  function exportCSV() {
    const rows = state.allResponses || [];
    if (!rows || rows.length === 0) {
      alert('No responses available to export.');
      return;
    }

    // Exact required columns:
    // id, age_range, education_level, current_status, tech_experience, interest_areas, learning_style, main_goal, available_time, budget_range, career_path, course_picked, achievement_text, submitted_at
    const headers = [
      'id',
      'age_range',
      'education_level',
      'current_status',
      'tech_experience',
      'interest_areas',
      'learning_style',
      'main_goal',
      'available_time',
      'budget_range',
      'career_path',
      'course_picked',
      'achievement_text',
      'submitted_at'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      if (Array.isArray(val)) {
        // Multi-select values joined with a semicolon (;) as specified
        val = val.join(';');
      }
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = '\uFEFF' + headers.join(',') + '\n'; // BOM for UTF-8

    rows.forEach(r => {
      const line = headers.map(h => escapeCSV(r[h])).join(',');
      csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bitfinder_responses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Copy Link
  function handleCopyLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      DOM.copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        DOM.copyBtnText.textContent = 'Copy Link';
      }, 2000);
    });
  }

  // Render SVG QR Code Generator
  function renderQRCode() {
    DOM.qrCodeDisplay.innerHTML = `
      <svg width="140" height="140" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" fill="white"/>
        <!-- Top Left Position Pattern -->
        <rect x="10" y="10" width="25" height="25" fill="#0B0F19"/>
        <rect x="15" y="15" width="15" height="15" fill="white"/>
        <rect x="18" y="18" width="9" height="9" fill="#38BDF8"/>
        <!-- Top Right Position Pattern -->
        <rect x="65" y="10" width="25" height="25" fill="#0B0F19"/>
        <rect x="70" y="15" width="15" height="15" fill="white"/>
        <rect x="73" y="18" width="9" height="9" fill="#38BDF8"/>
        <!-- Bottom Left Position Pattern -->
        <rect x="10" y="65" width="25" height="25" fill="#0B0F19"/>
        <rect x="15" y="70" width="15" height="15" fill="white"/>
        <rect x="18" y="73" width="9" height="9" fill="#38BDF8"/>
        <!-- Data Bits Modules -->
        <rect x="42" y="12" width="6" height="6" fill="#0B0F19"/>
        <rect x="50" y="12" width="6" height="6" fill="#0B0F19"/>
        <rect x="42" y="24" width="6" height="6" fill="#6366F1"/>
        <rect x="52" y="24" width="6" height="6" fill="#0B0F19"/>
        <rect x="12" y="42" width="6" height="6" fill="#0B0F19"/>
        <rect x="22" y="42" width="6" height="6" fill="#6366F1"/>
        <rect x="32" y="42" width="6" height="6" fill="#0B0F19"/>
        <rect x="42" y="42" width="16" height="16" fill="#0B0F19"/>
        <rect x="46" y="46" width="8" height="8" fill="#38BDF8"/>
        <rect x="65" y="42" width="6" height="6" fill="#0B0F19"/>
        <rect x="78" y="42" width="6" height="6" fill="#6366F1"/>
        <rect x="70" y="52" width="6" height="6" fill="#0B0F19"/>
        <rect x="82" y="52" width="6" height="6" fill="#0B0F19"/>
        <rect x="42" y="65" width="6" height="6" fill="#0B0F19"/>
        <rect x="52" y="72" width="6" height="6" fill="#6366F1"/>
        <rect x="65" y="65" width="6" height="6" fill="#0B0F19"/>
        <rect x="75" y="65" width="12" height="6" fill="#0B0F19"/>
        <rect x="65" y="78" width="6" height="12" fill="#0B0F19"/>
        <rect x="78" y="78" width="9" height="9" fill="#38BDF8"/>
      </svg>
    `;
  }

  // Execute on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
