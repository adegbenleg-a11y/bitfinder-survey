# 🚀 BitFinder Survey — Backend & Admin Dashboard Guide

**BitFinder** is a machine learning data collection tool designed for **Bitnox Technology (Abeokuta)**. Responses collected from Bitnox students are sanitized, validated, and persisted in a secure **Supabase (PostgreSQL)** database to serve as training data for an unsupervised clustering ML model built in Google Colab.

---

## 🏗️ Tech Stack & Architecture

- **Frontend:** Vanilla HTML5, CSS3 (Glassmorphic dark design system), JavaScript (ES6+), Lucide Icons
- **Backend API:** Node.js / Express server API with serverless endpoint support (`api/submit.js`)
- **Database:** Supabase (PostgreSQL) with strict **Row Level Security (RLS)** & CHECK constraints
- **Authentication:** Supabase Auth (Email & Password for protected Admin Dashboard)
- **Deployment Support:** Ready for **Vercel**, **Netlify**, or Node.js server environment

---

## 🗄️ Database Schema & RLS Setup

The database schema is defined in [`supabase/migrations/01_create_survey_responses.sql`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/bitfinder-survey/supabase/migrations/01_create_survey_responses.sql).

### Table: `survey_responses`

| Column Name | Type | Constraints / Description |
| :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, `default gen_random_uuid()` |
| `age_range` | `text` | Required. Check: `'Under 18'`, `'18-24'`, `'25-34'`, `'35+'` |
| `education_level` | `text` | Required. Check: `'SSCE'`, `'OND/HND'`, `'Undergraduate'`, `'Graduate'` |
| `current_status` | `text` | Required. Check: `'Student'`, `'Employed'`, `'Self-employed'`, `'Unemployed'` |
| `tech_experience` | `text` | Required. Check: `'None'`, `'Basic'`, `'Intermediate'` |
| `interest_areas` | `text[]` | Required array (1-3 items). Subset of 7 allowed areas |
| `learning_style` | `text` | Required. Check: `'Practical'`, `'Mix of both'`, `'Theory'` |
| `main_goal` | `text` | Required. Check: `'Get a job'`, `'Freelance'`, `'Start a business'`, `'School project'`, `'Just curious'` |
| `available_time` | `text` | Required. Check: `'Weekdays'`, `'Weekends'`, `'Flexible'` |
| `budget_range` | `text` | Required. Check: `'Under ₦100,000'`, `'₦150,000 - ₦200,000'`, `'₦300,000 - ₦400,000'`, `'Above ₦500,000'` |
| `career_path` | `text[]` | Required array (1-2 items). Subset of 4 allowed career paths |
| `course_picked` | `text` | Required. Allowed: 16 Bitnox courses |
| `achievement_text`| `text` | Required (20-300 characters). Whitespace trimmed & spam filtered |
| `submitted_at` | `timestamptz`| Required. Default `now()` |

> 🔒 **Privacy Guarantee:** No names, emails, phone numbers, or IP addresses are stored in the database.

---

## 🔐 Security & RLS Policy Summary

- **Anonymous Visitors (`anon`):** Allowed to **INSERT** valid survey responses only via server validation. Unauthenticated queries (`SELECT`), edits (`UPDATE`), and deletes (`DELETE`) are strictly forbidden.
- **Admin (`authenticated`):** Can **SELECT** all stored survey responses and **DELETE** individual rows.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In your Supabase project dashboard, navigate to **Project Settings -> API**.
3. Copy your **Project URL**, **`anon` public key**, and **`service_role` secret key**.

### 2. Run the SQL Migration Script
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Create a new query and copy the contents of [`supabase/migrations/01_create_survey_responses.sql`](file:///c:/Users/USER/.gemini/antigravity-ide/scratch/bitfinder-survey/supabase/migrations/01_create_survey_responses.sql).
3. Click **Run**. This will create the `survey_responses` table, install all CHECK constraints, build indexes, and enforce Row Level Security (RLS) policies.

### 3. Create the Admin User Account
1. In Supabase Dashboard, navigate to **Authentication -> Users**.
2. Click **Add User** -> **Create User**.
3. Enter an email (e.g. `admin@bitnox.tech`) and set a strong password.
4. Confirm user creation. (This account will be used to log into `/admin`).

---

## ⚙️ Environment Variables Setup

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Populate `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
PORT=3000
```

---

## 💻 Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser at `http://localhost:3000`.

---

## ☁️ Deployment Instructions

### Deploying to Vercel (Recommended)
1. Push this repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and click **Add New -> Project**.
3. Import your `bitfinder-survey` GitHub repository.
4. Under **Environment Variables**, add:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Click **Deploy**. Vercel will automatically host the static frontend and the API serverless endpoint at `/api/submit`.

### Deploying to Netlify
1. Import repository on [netlify.com](https://netlify.com).
2. Set Build Command to `npm run build` (or leave empty for static site) and Publish directory to `./`.
3. Add environment variables under **Site settings -> Environment variables**.
4. Click **Deploy**.

---

## ✅ Short Testing Checklist

- [x] **Submit Test Response:** Open the survey in browser, complete all 12 questions, and click **Submit Survey**. Verify the Thank You screen appears.
- [x] **Spam & Validation Check:** Try submitting with less than 20 characters in Q12 or repeated text (e.g. "aaaaaaaaaaaaaaaaaaaa"). Confirm server rejects it with a descriptive error message without losing user input.
- [x] **Admin Authentication:** Navigate to `#admin` or click the shield icon in header. Enter your Supabase Admin email and password. Confirm access is granted to the Admin Dashboard.
- [x] **Anonymous RLS Protection Test:** Run `SELECT * FROM survey_responses;` using an unauthenticated Supabase anon key (e.g., in browser console). Confirm 0 rows are returned / permission is denied.
- [x] **Dashboard Metrics & CSV Export:** Confirm total counts, course breakdown, and interest breakdown render. Click **Download CSV (Colab Ready)** and verify array columns (`interest_areas` and `career_path`) are semicolon `;` joined and UTF-8 encoded.
- [x] **Row Deletion:** Click **Delete** on a response row, accept the confirmation prompt, and verify the record is deleted from Supabase.
