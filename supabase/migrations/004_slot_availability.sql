-- Migration: Replace hours_per_week + available_days/required_days with slot-based availability

-- jobber_profiles: replace hours_per_week + available_days with available_slots
ALTER TABLE jobber_profiles
  ADD COLUMN available_slots TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE jobber_profiles
  DROP COLUMN hours_per_week,
  DROP COLUMN available_days;

-- jobs: replace hours_per_week + required_days with required_slots
ALTER TABLE jobs
  ADD COLUMN required_slots TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE jobs
  DROP COLUMN hours_per_week,
  DROP COLUMN required_days;

-- Tighten proficiency to 1-3
UPDATE jobber_skills SET proficiency = LEAST(proficiency, 3);
ALTER TABLE jobber_skills
  DROP CONSTRAINT IF EXISTS jobber_skills_proficiency_check,
  ADD CONSTRAINT jobber_skills_proficiency_check CHECK (proficiency BETWEEN 1 AND 3);

UPDATE job_skills SET min_proficiency = LEAST(min_proficiency, 3);
ALTER TABLE job_skills
  DROP CONSTRAINT IF EXISTS job_skills_min_proficiency_check,
  ADD CONSTRAINT job_skills_min_proficiency_check CHECK (min_proficiency BETWEEN 1 AND 3);

-- Update get_matched_jobs: slot-based availability, LIMIT 10, skill_score defaults to 1.0 when no required skills
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
  total_score FLOAT
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
      cp.full_name AS creator_name,
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
      )::FLOAT AS availability_score
    FROM open_jobs oj
    CROSS JOIN jobber_info jb
    LEFT JOIN profiles cp ON cp.id = oj.creator_id
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
    (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score)::FLOAT AS total_score
  FROM scored s
  ORDER BY (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
