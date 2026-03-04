-- Fix: Column aliases in get_matched_jobs must match RETURNS TABLE names exactly

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
  WITH jobber_info AS (
    SELECT
      p.estate AS j_estate,
      jp.hours_per_week AS j_hours,
      jp.available_days AS j_days
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
      oj.hours_per_week,
      oj.required_days,
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
        0.0
      )::FLOAT AS skill_score,
      (CASE WHEN oj.estate = jb.j_estate THEN 1.0 ELSE 0.0 END)::FLOAT AS location_score,
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
    s.hours_per_week,
    s.required_days,
    s.duration_weeks,
    s.creator_name,
    s.skill_score,
    s.location_score,
    s.availability_score,
    (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score)::FLOAT AS total_score
  FROM scored s
  ORDER BY (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score) DESC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
