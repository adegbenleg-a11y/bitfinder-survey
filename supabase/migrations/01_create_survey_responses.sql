-- ============================================================================
-- BitFinder Survey Database Migration
-- Target Table: survey_responses
-- Database System: Supabase PostgreSQL
-- Author: Goodness Boluwatife & Antigravity AI
-- ============================================================================

-- Drop existing table if exists (for clean migration)
-- DROP TABLE IF EXISTS public.survey_responses CASCADE;

-- 1. Create survey_responses Table
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  age_range TEXT NOT NULL CONSTRAINT chk_age_range CHECK (
    age_range IN ('Under 18', '18-24', '25-34', '35+')
  ),
  
  education_level TEXT NOT NULL CONSTRAINT chk_education_level CHECK (
    education_level IN ('SSCE', 'OND/HND', 'Undergraduate', 'Graduate')
  ),
  
  current_status TEXT NOT NULL CONSTRAINT chk_current_status CHECK (
    current_status IN ('Student', 'Employed', 'Self-employed', 'Unemployed')
  ),
  
  tech_experience TEXT NOT NULL CONSTRAINT chk_tech_experience CHECK (
    tech_experience IN ('None', 'Basic', 'Intermediate')
  ),
  
  interest_areas TEXT[] NOT NULL CONSTRAINT chk_interest_areas CHECK (
    cardinality(interest_areas) >= 1 AND 
    cardinality(interest_areas) <= 3 AND 
    interest_areas <@ ARRAY['Design', 'Coding', 'Hardware/Phones', 'Networking', 'Data', 'Business', 'Content/Video']::TEXT[]
  ),
  
  learning_style TEXT NOT NULL CONSTRAINT chk_learning_style CHECK (
    learning_style IN ('Practical', 'Mix of both', 'Theory')
  ),
  
  main_goal TEXT NOT NULL CONSTRAINT chk_main_goal CHECK (
    main_goal IN ('Get a job', 'Freelance', 'Start a business', 'School project', 'Just curious')
  ),
  
  available_time TEXT NOT NULL CONSTRAINT chk_available_time CHECK (
    available_time IN ('Weekdays', 'Weekends', 'Flexible')
  ),
  
  budget_range TEXT NOT NULL CONSTRAINT chk_budget_range CHECK (
    budget_range IN ('Under ₦100,000', '₦150,000 - ₦200,000', '₦300,000 - ₦400,000', 'Above ₦500,000')
  ),
  
  career_path TEXT[] NOT NULL CONSTRAINT chk_career_path CHECK (
    cardinality(career_path) >= 1 AND 
    cardinality(career_path) <= 2 AND 
    career_path <@ ARRAY['Tech employee', 'Freelancer', 'Entrepreneur', 'Further studies']::TEXT[]
  ),
  
  course_picked TEXT NOT NULL CONSTRAINT chk_course_picked CHECK (
    course_picked IN (
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
    )
  ),
  
  achievement_text TEXT NOT NULL CONSTRAINT chk_achievement_text CHECK (
    char_length(trim(achievement_text)) >= 20 AND 
    char_length(trim(achievement_text)) <= 300
  ),
  
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index on submitted_at for quick admin sorting & analytics
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at 
  ON public.survey_responses (submitted_at DESC);

-- Add index on course_picked for metric grouping
CREATE INDEX IF NOT EXISTS idx_survey_responses_course_picked 
  ON public.survey_responses (course_picked);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow authenticated admin select" ON public.survey_responses;
DROP POLICY IF EXISTS "Allow authenticated admin delete" ON public.survey_responses;

-- Policy A: Anonymous visitors can INSERT only. They can NEVER SELECT, UPDATE, or DELETE.
CREATE POLICY "Allow anonymous insert" 
ON public.survey_responses
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy B: Only authenticated admin can SELECT data.
CREATE POLICY "Allow authenticated admin select" 
ON public.survey_responses
FOR SELECT 
TO authenticated
USING (true);

-- Policy C: Only authenticated admin can DELETE data.
CREATE POLICY "Allow authenticated admin delete" 
ON public.survey_responses
FOR DELETE 
TO authenticated
USING (true);

-- Note: UPDATE operations are strictly prohibited (no UPDATE policy created).

-- Verification query (Run as anon to verify RLS privacy enforcement):
-- SELECT * FROM public.survey_responses; -- Should return 0 rows for unauthenticated requests.
