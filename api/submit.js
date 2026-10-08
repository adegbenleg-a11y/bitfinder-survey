const { createClient } = require('@supabase/supabase-js');

// Allowed Option Lists for Strict Validation
const ALLOWED_OPTIONS = {
  age_range: ['Under 18', '18-24', '25-34', '35+'],
  education_level: ['SSCE', 'OND/HND', 'Undergraduate', 'Graduate'],
  current_status: ['Student', 'Employed', 'Self-employed', 'Unemployed'],
  tech_experience: ['None', 'Basic', 'Intermediate'],
  interest_areas: ['Design', 'Coding', 'Hardware/Phones', 'Networking', 'Data', 'Business', 'Content/Video'],
  learning_style: ['Practical', 'Mix of both', 'Theory'],
  main_goal: ['Get a job', 'Freelance', 'Start a business', 'School project', 'Just curious'],
  available_time: ['Weekdays', 'Weekends', 'Flexible'],
  budget_range: ['Under ₦100,000', '₦150,000 - ₦200,000', '₦300,000 - ₦400,000', 'Above ₦500,000'],
  career_path: ['Tech employee', 'Freelancer', 'Entrepreneur', 'Further studies'],
  course_picked: [
    'Frontend Development (JavaScript)',
    'Backend Development (JavaScript)',
    'Backend Development (Python)',
    'Python Mastery',
    'Mobile App Development',
    'Machine Learning',
    'Data Analytics',
    'Cybersecurity',
    'Product Design',
    'Digital Marketing',
    'Digital Literacy',
    'Prompt Engineering',
    'Generative AI Mastery',
    'AI Automation',
    'ESL Tutoring',
    'Not decided yet'
  ]
};

// In-Memory Rate Limiting Guard (1 submission per IP per hour)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip) {
  if (!ip) return true;
  const now = Date.now();
  const lastSubmit = rateLimitMap.get(ip);
  if (lastSubmit && now - lastSubmit < RATE_LIMIT_WINDOW_MS) {
    return false;
  }
  rateLimitMap.set(ip, now);
  // Clean up old entries
  if (rateLimitMap.size > 10000) {
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }
  return true;
}

// Serverless / Express Endpoint Handler
module.exports = async function handler(req, res) {
  // Support CORS
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    return res.status ? res.status(200).end() : res.end();
  }

  if (req.method !== 'POST') {
    return (res.status ? res.status(405) : res).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // 1. Honeypot Check (Spam guard)
    if (body.hp_field && body.hp_field.trim() !== '') {
      console.warn('Honeypot triggered, rejecting submission.');
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Spam detected.' });
    }

    // 2. Rate Limiting Check
    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    if (!checkRateLimit(clientIp)) {
      return (res.status ? res.status(429) : res).json({
        success: false,
        error: 'Too many survey submissions from this network. Please wait an hour before submitting again.'
      });
    }

    // 3. Extract & Normalize Inputs
    const age_range = (body.age_range || '').trim();
    const education_level = (body.education_level || '').trim();
    const current_status = (body.current_status || '').trim();
    const tech_experience = (body.tech_experience || '').trim();
    const learning_style = (body.learning_style || '').trim();
    const main_goal = (body.main_goal || '').trim();
    const available_time = (body.available_time || '').trim();
    const budget_range = (body.budget_range || '').trim();
    const course_picked = (body.course_picked || '').trim();
    const achievement_text = (body.achievement_text || '').trim();

    // Multi-select arrays
    let interest_areas = Array.isArray(body.interest_areas)
      ? body.interest_areas.map(s => String(s).trim())
      : (typeof body.interest_areas === 'string' ? body.interest_areas.split(',').map(s => s.trim()) : []);

    let career_path = Array.isArray(body.career_path)
      ? body.career_path.map(s => String(s).trim())
      : (typeof body.career_path === 'string' ? body.career_path.split(',').map(s => s.trim()) : []);

    // 4. Server-Side Validation
    if (!ALLOWED_OPTIONS.age_range.includes(age_range)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid age range option selected.' });
    }
    if (!ALLOWED_OPTIONS.education_level.includes(education_level)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid education level option selected.' });
    }
    if (!ALLOWED_OPTIONS.current_status.includes(current_status)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid current status option selected.' });
    }
    if (!ALLOWED_OPTIONS.tech_experience.includes(tech_experience)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid tech experience option selected.' });
    }
    if (!ALLOWED_OPTIONS.learning_style.includes(learning_style)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid learning style option selected.' });
    }
    if (!ALLOWED_OPTIONS.main_goal.includes(main_goal)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid main goal option selected.' });
    }
    if (!ALLOWED_OPTIONS.available_time.includes(available_time)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid available time option selected.' });
    }
    if (!ALLOWED_OPTIONS.budget_range.includes(budget_range)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid budget range option selected.' });
    }
    if (!ALLOWED_OPTIONS.course_picked.includes(course_picked)) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Invalid course picked option selected.' });
    }

    // Validate interest_areas array
    if (!Array.isArray(interest_areas) || interest_areas.length < 1 || interest_areas.length > 3) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Please select between 1 and 3 interest areas.' });
    }
    for (const area of interest_areas) {
      if (!ALLOWED_OPTIONS.interest_areas.includes(area)) {
        return (res.status ? res.status(400) : res).json({ success: false, error: `Invalid interest area: "${area}".` });
      }
    }

    // Validate career_path array
    if (!Array.isArray(career_path) || career_path.length < 1 || career_path.length > 2) {
      return (res.status ? res.status(400) : res).json({ success: false, error: 'Please select 1 or 2 career paths.' });
    }
    for (const path of career_path) {
      if (!ALLOWED_OPTIONS.career_path.includes(path)) {
        return (res.status ? res.status(400) : res).json({ success: false, error: `Invalid career path: "${path}".` });
      }
    }

    // Validate achievement_text (length & spam detection)
    if (achievement_text.length < 20 || achievement_text.length > 300) {
      return (res.status ? res.status(400) : res).json({
        success: false,
        error: 'Achievement goal text must be between 20 and 300 characters long.'
      });
    }

    // Spam / Gibberish Check for achievement_text
    const uniqueChars = new Set(achievement_text.toLowerCase().replace(/[^a-z0-9]/g, ''));
    if (uniqueChars.size < 4) {
      return (res.status ? res.status(400) : res).json({
        success: false,
        error: 'Achievement goal contains meaningless or repeated characters. Please enter a meaningful response.'
      });
    }
    if (/(.)\1{6,}/i.test(achievement_text)) {
      return (res.status ? res.status(400) : res).json({
        success: false,
        error: 'Achievement goal contains excessive character repetition. Please enter a genuine goal.'
      });
    }

    // 5. Connect to Supabase
    const supabaseUrl = process.env.SUPABASE_URL || body.supabaseUrl;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || body.supabaseKey;

    if (!supabaseUrl || !supabaseKey) {
      return (res.status ? res.status(500) : res).json({
        success: false,
        error: 'Backend environment misconfigured: SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY are missing.'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 6. Insert Into survey_responses Table
    const recordPayload = {
      age_range,
      education_level,
      current_status,
      tech_experience,
      interest_areas,
      learning_style,
      main_goal,
      available_time,
      budget_range,
      career_path,
      course_picked,
      achievement_text,
      submitted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('survey_responses')
      .insert([recordPayload])
      .select('id');

    if (error) {
      console.error('Supabase DB Insert Error:', error);
      return (res.status ? res.status(400) : res).json({
        success: false,
        error: `Database insertion error: ${error.message}`
      });
    }

    return (res.status ? res.status(200) : res).json({
      success: true,
      message: 'Survey response validated and recorded successfully.',
      id: data && data[0] ? data[0].id : null
    });

  } catch (err) {
    console.error('API submission exception:', err);
    return (res.status ? res.status(500) : res).json({
      success: false,
      error: 'An internal server error occurred while processing your survey.'
    });
  }
};
