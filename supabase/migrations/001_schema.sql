-- MicroMatch MVP Schema
-- Tables, enums, RLS policies, triggers, and seed data

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('jobber', 'creator');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE job_status AS ENUM ('open', 'closed', 'filled');

-- ============================================================
-- TABLES
-- ============================================================

-- All users (auto-created on signup via trigger)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role,
  full_name TEXT NOT NULL DEFAULT '',
  estate TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobber-specific profile data
CREATE TABLE jobber_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth DATE,
  bio TEXT NOT NULL DEFAULT '',
  hours_per_week INTEGER NOT NULL DEFAULT 0,
  available_days TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skill categories (e.g. Culinary, Fitness)
CREATE TABLE skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Individual skills within categories
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  UNIQUE(category_id, name)
);

-- Jobber's skills with proficiency rating
CREATE TABLE jobber_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jobber_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency INTEGER NOT NULL DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  UNIQUE(jobber_id, skill_id)
);

-- Jobs posted by creators
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  estate TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL DEFAULT 0,
  required_days TEXT[] NOT NULL DEFAULT '{}',
  duration_weeks INTEGER,
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skills required for a job with minimum proficiency
CREATE TABLE job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  min_proficiency INTEGER NOT NULL DEFAULT 1 CHECK (min_proficiency BETWEEN 1 AND 5),
  UNIQUE(job_id, skill_id)
);

-- Applications from jobbers to jobs
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  jobber_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, jobber_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_jobs_creator ON jobs(creator_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_estate ON jobs(estate);
CREATE INDEX idx_jobber_skills_jobber ON jobber_skills(jobber_id);
CREATE INDEX idx_jobber_skills_skill ON jobber_skills(skill_id);
CREATE INDEX idx_job_skills_job ON job_skills(job_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_jobber ON applications(jobber_id);
CREATE INDEX idx_skills_category ON skills(category_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobber_profiles_updated_at BEFORE UPDATE ON jobber_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'role')::user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- If signing up as jobber, also create jobber_profiles row
  IF (NEW.raw_user_meta_data->>'role') = 'jobber' THEN
    INSERT INTO jobber_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobber_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Jobber profiles: users can read all, update own
CREATE POLICY "jobber_profiles_select" ON jobber_profiles FOR SELECT USING (true);
CREATE POLICY "jobber_profiles_update" ON jobber_profiles FOR UPDATE USING (auth.uid() = id);

-- Skill categories & skills: readable by all
CREATE POLICY "skill_categories_select" ON skill_categories FOR SELECT USING (true);
CREATE POLICY "skills_select" ON skills FOR SELECT USING (true);

-- Jobber skills: readable by all, managed by own jobber
CREATE POLICY "jobber_skills_select" ON jobber_skills FOR SELECT USING (true);
CREATE POLICY "jobber_skills_insert" ON jobber_skills FOR INSERT WITH CHECK (auth.uid() = jobber_id);
CREATE POLICY "jobber_skills_update" ON jobber_skills FOR UPDATE USING (auth.uid() = jobber_id);
CREATE POLICY "jobber_skills_delete" ON jobber_skills FOR DELETE USING (auth.uid() = jobber_id);

-- Jobs: readable by all, managed by creator
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (auth.uid() = creator_id);

-- Job skills: readable by all, managed by job creator
CREATE POLICY "job_skills_select" ON job_skills FOR SELECT USING (true);
CREATE POLICY "job_skills_insert" ON job_skills FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.creator_id = auth.uid()));
CREATE POLICY "job_skills_delete" ON job_skills FOR DELETE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.creator_id = auth.uid()));

-- Applications: jobber sees own, creator sees applications for their jobs
CREATE POLICY "applications_select_jobber" ON applications FOR SELECT
  USING (auth.uid() = jobber_id);
CREATE POLICY "applications_select_creator" ON applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.creator_id = auth.uid()));
CREATE POLICY "applications_insert" ON applications FOR INSERT
  WITH CHECK (auth.uid() = jobber_id);
CREATE POLICY "applications_update_creator" ON applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.creator_id = auth.uid()));

-- ============================================================
-- MATCHING FUNCTION (RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION get_matched_jobs(p_jobber_id UUID)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  description TEXT,
  estate TEXT,
  hours_per_week INTEGER,
  required_days TEXT[],
  duration_weeks INTEGER,
  creator_name TEXT,
  skill_score FLOAT,
  location_score FLOAT,
  availability_score FLOAT,
  total_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH jobber AS (
    SELECT
      p.estate AS j_estate,
      jp.hours_per_week AS j_hours,
      jp.available_days AS j_days
    FROM profiles p
    JOIN jobber_profiles jp ON jp.id = p.id
    WHERE p.id = p_jobber_id
  ),
  jobber_skill_set AS (
    SELECT skill_id, proficiency
    FROM jobber_skills
    WHERE jobber_id = p_jobber_id
  ),
  applied_jobs AS (
    SELECT a.job_id FROM applications a WHERE a.jobber_id = p_jobber_id
  ),
  open_jobs AS (
    SELECT j.*
    FROM jobs j
    WHERE j.status = 'open'
      AND j.id NOT IN (SELECT aj.job_id FROM applied_jobs aj)
  ),
  scored AS (
    SELECT
      oj.id AS s_job_id,
      oj.title AS s_title,
      oj.description AS s_description,
      oj.estate AS s_estate,
      oj.hours_per_week AS s_hours,
      oj.required_days AS s_days,
      oj.duration_weeks AS s_duration,
      cp.full_name AS s_creator_name,
      -- Skill score: avg(min(jobber_proficiency, 5) / required) for matched skills, 0 for unmatched
      COALESCE(
        (SELECT AVG(
          CASE
            WHEN jss.skill_id IS NOT NULL
            THEN LEAST(jss.proficiency::FLOAT / js.min_proficiency::FLOAT, 1.0)
            ELSE 0.0
          END
        )
        FROM job_skills js
        LEFT JOIN jobber_skill_set jss ON jss.skill_id = js.skill_id
        WHERE js.job_id = oj.id),
        0.0
      ) AS s_skill_score,
      -- Location score: 1.0 same estate, 0.0 otherwise (adjacency handled in app layer)
      CASE WHEN oj.estate = jb.j_estate THEN 1.0 ELSE 0.0 END AS s_location_score,
      -- Availability score: 0.5 * hours_ratio + 0.5 * days_overlap_ratio
      (
        0.5 * CASE
          WHEN oj.hours_per_week = 0 THEN 1.0
          ELSE LEAST(jb.j_hours::FLOAT / oj.hours_per_week::FLOAT, 1.0)
        END
        +
        0.5 * CASE
          WHEN array_length(oj.required_days, 1) IS NULL OR array_length(oj.required_days, 1) = 0 THEN 1.0
          ELSE (
            SELECT COUNT(*)::FLOAT / array_length(oj.required_days, 1)::FLOAT
            FROM unnest(oj.required_days) rd
            WHERE rd = ANY(jb.j_days)
          )
        END
      ) AS s_availability_score
    FROM open_jobs oj
    CROSS JOIN jobber jb
    LEFT JOIN profiles cp ON cp.id = oj.creator_id
  )
  SELECT
    s.s_job_id,
    s.s_title,
    s.s_description,
    s.s_estate,
    s.s_hours,
    s.s_days,
    s.s_duration,
    s.s_creator_name,
    s.s_skill_score,
    s.s_location_score,
    s.s_availability_score,
    (0.5 * s.s_skill_score + 0.25 * s.s_location_score + 0.25 * s.s_availability_score) AS total_score
  FROM scored s
  ORDER BY (0.5 * s.s_skill_score + 0.25 * s.s_location_score + 0.25 * s.s_availability_score) DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE BUCKET FOR AVATARS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- ============================================================
-- SEED DATA: Skill Categories & Skills
-- ============================================================

INSERT INTO skill_categories (name, display_order) VALUES
  ('Culinary', 1),
  ('Fitness', 2),
  ('Healthcare', 3),
  ('Education', 4),
  ('Handyman', 5),
  ('Admin', 6);

-- Culinary skills
INSERT INTO skills (category_id, name)
SELECT id, unnest(ARRAY['Home Cooking', 'Baking & Pastry', 'Food Catering', 'Meal Prep', 'Kitchen Hygiene'])
FROM skill_categories WHERE name = 'Culinary';

-- Fitness skills
INSERT INTO skills (category_id, name)
SELECT id, unnest(ARRAY['Personal Training', 'Yoga Instruction', 'Group Fitness', 'Senior Exercise', 'Swimming Coaching'])
FROM skill_categories WHERE name = 'Fitness';

-- Healthcare skills
INSERT INTO skills (category_id, name)
SELECT id, unnest(ARRAY['Basic Nursing Care', 'Elder Care', 'First Aid', 'Physiotherapy Assist', 'Medication Management'])
FROM skill_categories WHERE name = 'Healthcare';

-- Education skills
INSERT INTO skills (category_id, name)
SELECT id, unnest(ARRAY['Tutoring (Primary)', 'Tutoring (Secondary)', 'Music Teaching', 'Language Teaching', 'IT Basics Training'])
FROM skill_categories WHERE name = 'Education';

-- Handyman skills
INSERT INTO skills (category_id, name)
SELECT id, unnest(ARRAY['Plumbing Repair', 'Electrical Repair', 'Painting', 'Furniture Assembly', 'General Maintenance'])
FROM skill_categories WHERE name = 'Handyman';

-- Admin skills
INSERT INTO skills (category_id, name)
SELECT id, unnest(ARRAY['Data Entry', 'Filing & Organisation', 'Reception Duties', 'Bookkeeping', 'Event Coordination'])
FROM skill_categories WHERE name = 'Admin';
