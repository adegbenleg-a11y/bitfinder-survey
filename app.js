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
      interest_areas: [], // array for multi-select
      learning_style: '',
      main_goal: '',
      available_time: '',
      budget_range: '',
      career_path: [], // array for multi-select
      course_picked: '',
      achievement_text: ''
    },
    adminAuthenticated: false,
    adminPasswordHash: 'bitnox2026', // Default password
    supabaseUrl: localStorage.getItem('bitfinder_sb_url') || '',
    supabaseKey: localStorage.getItem('bitfinder_sb_key') || '',
    supabaseClient: null,
    isSubmitting: false,
    hasSubmitted: sessionStorage.getItem('bitfinder_submitted') === 'true'
  };

  // List of 12 Questions
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
      hint: 'Tick up to 3 areas (Max 3 options)',
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
            { label: 'Artificial Intelligence', icon: 'cpu' },
            { label: 'Generative AI Mastery', icon: 'sparkles' },
            { label: 'AI Automation', icon: 'bot' },
            { label: 'Prompt Engineering', icon: 'message-square-code' }
          ]
        },
        {
          name: 'IT & Security',
          options: [
            { label: 'Information Technology', icon: 'monitor' },
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
          name: 'Language & Communication',
          options: [
            { label: 'ESL Tutoring', icon: 'languages' }
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

    // Thank You Screen Controls
    qrCodeDisplay: document.getElementById('qr-code-display'),
    copyLinkBtn: document.getElementById('copy-link-btn'),
    copyBtnText: document.getElementById('copy-btn-text'),
    viewAdminBtn: document.getElementById('view-admin-btn'),
    restartBtn: document.getElementById('restart-btn'),

    // Admin Controls
    adminAuthBox: document.getElementById('admin-auth-box'),
    adminLoginForm: document.getElementById('admin-login-form'),
    adminPassInput: document.getElementById('admin-pass-input'),
    authErrorMsg: document.getElementById('auth-error-msg'),
    adminCancelBtn: document.getElementById('admin-cancel-btn'),
    adminContentBox: document.getElementById('admin-content-box'),
    adminLogoutBtn: document.getElementById('admin-logout-btn'),
    closeAdminBtn: document.getElementById('close-admin-btn'),

    // Admin Dashboard Stats & Table
    statTotalCount: document.getElementById('stat-total-count'),
    statTopCourse: document.getElementById('stat-top-course'),
    statTopGoal: document.getElementById('stat-top-goal'),
    statStorageType: document.getElementById('stat-storage-type'),
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
    saveSbBtn: document.getElementById('save-sb-btn'),
    copySqlBtn: document.getElementById('copy-sql-btn')
  };

  // Initialize Application
  function init() {
    setupSupabaseClient();
    bindEvents();
    renderQRCode();

    // Check URL route hash for #admin
    if (window.location.hash === '#admin') {
      showScreen(DOM.adminScreen);
    }
  }

  // Supabase Client Setup
  function setupSupabaseClient() {
    if (state.supabaseUrl && state.supabaseKey && window.supabase) {
      try {
        state.supabaseClient = window.supabase.createClient(state.supabaseUrl, state.supabaseKey);
        DOM.statStorageType.textContent = 'Supabase Cloud';
      } catch (err) {
        console.warn('Supabase init failed:', err);
        DOM.statStorageType.textContent = 'LocalStorage Only';
      }
    } else {
      DOM.statStorageType.textContent = 'LocalStorage Only';
    }
  }

  // Event Listeners Binding
  function bindEvents() {
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

    // Admin Auth Form
    DOM.adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = DOM.adminPassInput.value.trim();
      if (entered === state.adminPasswordHash) {
        state.adminAuthenticated = true;
        DOM.adminAuthBox.classList.add('hidden');
        DOM.adminContentBox.classList.remove('hidden');
        DOM.authErrorMsg.classList.add('hidden');
        loadAdminDashboardData();
      } else {
        DOM.authErrorMsg.classList.remove('hidden');
      }
    });

    DOM.adminCancelBtn.addEventListener('click', () => {
      showScreen(DOM.landingScreen);
    });

    DOM.adminLogoutBtn.addEventListener('click', () => {
      state.adminAuthenticated = false;
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
      alert('Supabase credentials saved successfully!');
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
        const { error } = await tempClient.from('bitfinder_surveys').select('id').limit(1);
        if (error) {
          alert('Supabase connection error: ' + error.message);
        } else {
          alert('Success! Supabase database connection verified.');
        }
      } catch (err) {
        alert('Connection test failed: ' + err.message);
      }
    });

    DOM.copySqlBtn.addEventListener('click', () => {
      const sqlCode = document.getElementById('sql-code-snippet').innerText;
      navigator.clipboard.writeText(sqlCode).then(() => {
        DOM.copySqlBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
        setTimeout(() => {
          DOM.copySqlBtn.innerHTML = '<i data-lucide="copy"></i> Copy SQL';
          lucide.createIcons();
        }, 2000);
      });
    });
  }

  // Screen Switcher
  function showScreen(screenEl) {
    [DOM.landingScreen, DOM.questionScreen, DOM.thankyouScreen, DOM.adminScreen].forEach(s => {
      s.classList.remove('active');
    });
    screenEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh Lucide Icons
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

  // Submit Survey to Supabase / LocalStorage
  async function submitSurvey() {
    if (state.isSubmitting || state.hasSubmitted) return;

    state.isSubmitting = true;
    DOM.nextBtn.disabled = true;
    DOM.nextBtnText.textContent = 'Submitting...';

    // Format Data Payload according to exact required column names:
    // age_range, education_level, current_status, tech_experience, interest_areas, learning_style, main_goal, available_time, budget_range, career_path, course_picked, achievement_text, submitted_at
    const payload = {
      age_range: state.answers.age_range,
      education_level: state.answers.education_level,
      current_status: state.answers.current_status,
      tech_experience: state.answers.tech_experience,
      interest_areas: Array.isArray(state.answers.interest_areas) ? state.answers.interest_areas.join(', ') : state.answers.interest_areas,
      learning_style: state.answers.learning_style,
      main_goal: state.answers.main_goal,
      available_time: state.answers.available_time,
      budget_range: state.answers.budget_range,
      career_path: Array.isArray(state.answers.career_path) ? state.answers.career_path.join(', ') : state.answers.career_path,
      course_picked: state.answers.course_picked,
      achievement_text: state.answers.achievement_text,
      submitted_at: new Date().toISOString()
    };

    // Save to LocalStorage Store
    saveLocalResponse(payload);

    // Save to Supabase Cloud if configured
    if (state.supabaseClient) {
      try {
        const { error } = await state.supabaseClient.from('bitfinder_surveys').insert([payload]);
        if (error) {
          console.error('Supabase save error:', error);
        }
      } catch (err) {
        console.error('Supabase submission exception:', err);
      }
    }

    state.hasSubmitted = true;
    sessionStorage.setItem('bitfinder_submitted', 'true');
    state.isSubmitting = false;

    showScreen(DOM.thankyouScreen);
  }

  // LocalStorage Response Store
  function saveLocalResponse(record) {
    const existing = JSON.parse(localStorage.getItem('bitfinder_responses') || '[]');
    existing.push(record);
    localStorage.setItem('bitfinder_responses', JSON.stringify(existing));
  }

  function getLocalResponses() {
    return JSON.parse(localStorage.getItem('bitfinder_responses') || '[]');
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
    showScreen(DOM.questionScreen);
    renderQuestion();
  }

  // Load Admin Dashboard Data
  async function loadAdminDashboardData() {
    let responses = getLocalResponses();

    // Fetch from Supabase if connected
    if (state.supabaseClient) {
      try {
        const { data, error } = await state.supabaseClient
          .from('bitfinder_surveys')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!error && data && data.length > 0) {
          responses = data;
        }
      } catch (err) {
        console.warn('Could not fetch from Supabase admin:', err);
      }
    }

    state.allResponses = responses;

    // Update Stats
    DOM.statTotalCount.textContent = responses.length;

    if (responses.length > 0) {
      const courseCounts = {};
      const goalCounts = {};
      responses.forEach(r => {
        if (r.course_picked) courseCounts[r.course_picked] = (courseCounts[r.course_picked] || 0) + 1;
        if (r.main_goal) goalCounts[r.main_goal] = (goalCounts[r.main_goal] || 0) + 1;
      });

      const topCourse = Object.keys(courseCounts).reduce((a, b) => courseCounts[a] > courseCounts[b] ? a : b, 'N/A');
      const topGoal = Object.keys(goalCounts).reduce((a, b) => goalCounts[a] > goalCounts[b] ? a : b, 'N/A');

      DOM.statTopCourse.textContent = topCourse;
      DOM.statTopGoal.textContent = topGoal;
    } else {
      DOM.statTopCourse.textContent = 'N/A';
      DOM.statTopGoal.textContent = 'N/A';
    }

    renderTableRows(getFilteredResponses());
  }

  // Filter Responses by Search Keyword
  function getFilteredResponses() {
    const list = state.allResponses || getLocalResponses();
    const query = (DOM.adminSearchInput.value || '').toLowerCase().trim();

    if (!query) return list;

    return list.filter(r => {
      return (
        (r.course_picked || '').toLowerCase().includes(query) ||
        (r.main_goal || '').toLowerCase().includes(query) ||
        (r.current_status || '').toLowerCase().includes(query) ||
        (r.achievement_text || '').toLowerCase().includes(query) ||
        (r.interest_areas || '').toLowerCase().includes(query)
      );
    });
  }

  // Render Data Table Rows
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

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${dateStr}</td>
        <td>${r.age_range || '-'}</td>
        <td>${r.education_level || '-'}</td>
        <td>${r.current_status || '-'}</td>
        <td>${r.tech_experience || '-'}</td>
        <td>${r.interest_areas || '-'}</td>
        <td>${r.learning_style || '-'}</td>
        <td>${r.main_goal || '-'}</td>
        <td>${r.available_time || '-'}</td>
        <td>${r.budget_range || '-'}</td>
        <td>${r.career_path || '-'}</td>
        <td><strong>${r.course_picked || '-'}</strong></td>
        <td>${r.achievement_text || '-'}</td>
      `;
      DOM.responsesTableBody.appendChild(tr);
    });
  }

  // Export Responses as CSV for Google Colab / Pandas
  function exportCSV() {
    const rows = state.allResponses || getLocalResponses();
    if (!rows || rows.length === 0) {
      alert('No responses available to export.');
      return;
    }

    const headers = [
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
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    let csvContent = headers.join(',') + '\n';

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
    const url = window.location.href;
    // Generate simple SVG QR Code placeholder graphic or interactive QR pattern
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
