-- Migration 006: Feature additions
-- Run entirely in Supabase SQL Editor

-- ============================================================
-- 1a. Expand applications.status: ENUM → TEXT with CHECK
-- ============================================================
ALTER TABLE applications ADD COLUMN status_new TEXT NOT NULL DEFAULT 'pending'
  CHECK (status_new IN ('pending','under_review','accepted','withdrawn_by_creator','withdrawn_by_jobber'));

UPDATE applications SET status_new = CASE
  WHEN status::TEXT = 'pending'  THEN 'pending'
  WHEN status::TEXT = 'accepted' THEN 'accepted'
  WHEN status::TEXT = 'rejected' THEN 'withdrawn_by_creator'
  ELSE 'pending'
END;

ALTER TABLE applications DROP COLUMN status;
ALTER TABLE applications RENAME COLUMN status_new TO status;
DROP TYPE IF EXISTS application_status;

-- ============================================================
-- 1b. New creator_profiles table
-- ============================================================
CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  bio TEXT NOT NULL DEFAULT '',
  contact_number TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creator_profiles_select_public"
  ON creator_profiles FOR SELECT USING (true);

CREATE POLICY "creator_profiles_insert_own"
  ON creator_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "creator_profiles_update_own"
  ON creator_profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger for updated_at (reuse existing function)
CREATE TRIGGER creator_profiles_updated_at
  BEFORE UPDATE ON creator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-populate for existing creators
INSERT INTO creator_profiles (id)
SELECT id FROM profiles WHERE role = 'creator'
ON CONFLICT DO NOTHING;

-- Update handle_new_user trigger function to also insert into creator_profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, estate)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'jobber'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'estate', '')
  );

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'jobber') = 'jobber' THEN
    INSERT INTO jobber_profiles (id) VALUES (NEW.id);
  END IF;

  IF COALESCE(NEW.raw_user_meta_data->>'role', 'jobber') = 'creator' THEN
    INSERT INTO creator_profiles (id) VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 1c. Add remuneration columns to jobs
-- ============================================================
ALTER TABLE jobs
  ADD COLUMN remuneration_per_hour_min NUMERIC(10,2),
  ADD COLUMN remuneration_per_hour_max NUMERIC(10,2);

-- ============================================================
-- 1d. New job_photos table
-- ============================================================
CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_photos_select_public"
  ON job_photos FOR SELECT USING (true);

CREATE POLICY "job_photos_insert_own"
  ON job_photos FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_id AND j.creator_id = auth.uid())
  );

CREATE POLICY "job_photos_delete_own"
  ON job_photos FOR DELETE USING (
    EXISTS (SELECT 1 FROM jobs j WHERE j.id = job_id AND j.creator_id = auth.uid())
  );

-- ============================================================
-- 1e. Add photo_id_url to jobber_profiles
-- ============================================================
ALTER TABLE jobber_profiles ADD COLUMN photo_id_url TEXT;

-- ============================================================
-- 1f. Create job-photos storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "job_photos_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');

CREATE POLICY "job_photos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-photos' AND auth.role() = 'authenticated');

CREATE POLICY "job_photos_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'job-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- ============================================================
-- 1g. Update get_matched_jobs RPC
-- ============================================================
CREATE OR REPLACE FUNCTION get_matched_jobs(p_jobber_id UUID)
RETURNS TABLE (
  job_id UUID,
  title TEXT,
  description TEXT,
  estate TEXT,
  required_slots TEXT[],
  duration_weeks INTEGER,
  creator_name TEXT,
  skill_score FLOAT,
  location_score FLOAT,
  availability_score FLOAT,
  total_score FLOAT,
  creator_bio TEXT,
  contact_number TEXT,
  remuneration_per_hour_min NUMERIC,
  remuneration_per_hour_max NUMERIC,
  job_photos JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH jobber_info AS (
    SELECT
      p.estate AS j_estate,
      jp.available_slots AS j_slots
    FROM profiles p
    JOIN jobber_profiles jp ON jp.id = p.id
    WHERE p.id = p_jobber_id
  ),
  jobber_skill_set AS (
    SELECT js.skill_id, js.proficiency
    FROM jobber_skills js
    WHERE js.jobber_id = p_jobber_id
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
      oj.id,
      oj.title,
      oj.description,
      oj.estate,
      oj.required_slots,
      oj.duration_weeks,
      oj.remuneration_per_hour_min,
      oj.remuneration_per_hour_max,
      cp.full_name AS creator_name,
      COALESCE(cp2.bio, '') AS creator_bio,
      COALESCE(cp2.contact_number, '') AS contact_number,
      COALESCE(
        (SELECT AVG(
          CASE
            WHEN jss.skill_id IS NOT NULL
            THEN LEAST(jss.proficiency::FLOAT / jsk.min_proficiency::FLOAT, 1.0)
            ELSE 0.0
          END
        )
        FROM job_skills jsk
        LEFT JOIN jobber_skill_set jss ON jss.skill_id = jsk.skill_id
        WHERE jsk.job_id = oj.id),
        1.0
      )::FLOAT AS skill_score,
      (CASE WHEN oj.estate = jb.j_estate THEN 1.0 ELSE 0.0 END)::FLOAT AS location_score,
      (
        CASE
          WHEN array_length(oj.required_slots, 1) IS NULL OR array_length(oj.required_slots, 1) = 0 THEN 1.0
          ELSE (
            SELECT COUNT(*)::FLOAT / array_length(oj.required_slots, 1)::FLOAT
            FROM unnest(oj.required_slots) rs
            WHERE rs = ANY(jb.j_slots)
          )
        END
      )::FLOAT AS availability_score,
      (
        SELECT COALESCE(
          jsonb_agg(
            jsonb_build_object('photo_url', jp2.photo_url, 'display_order', jp2.display_order)
            ORDER BY jp2.display_order
          ),
          '[]'::jsonb
        )
        FROM job_photos jp2
        WHERE jp2.job_id = oj.id
      ) AS job_photos_agg
    FROM open_jobs oj
    CROSS JOIN jobber_info jb
    LEFT JOIN profiles cp ON cp.id = oj.creator_id
    LEFT JOIN creator_profiles cp2 ON cp2.id = oj.creator_id
  )
  SELECT
    s.id AS job_id,
    s.title,
    s.description,
    s.estate,
    s.required_slots,
    s.duration_weeks,
    s.creator_name,
    s.skill_score,
    s.location_score,
    s.availability_score,
    (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score)::FLOAT AS total_score,
    s.creator_bio,
    s.contact_number,
    s.remuneration_per_hour_min,
    s.remuneration_per_hour_max,
    s.job_photos_agg AS job_photos
  FROM scored s
  ORDER BY (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
