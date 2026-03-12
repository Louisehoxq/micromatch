-- Migration 013: Fix job matching logic and add more fitness jobs for Rajan
--
-- Bugs fixed:
--   1. withdrawn_by_jobber applications no longer block a job from reappearing
--   2. Zero-score jobs (0% match) are filtered out of the feed
--
-- New data:
--   job7 – Aqua Fitness Instructor (Serangoon, Tue_afternoon + Thu_afternoon)  → 100%
--   job8 – Weekend Bootcamp Trainer (Bishan,    Tue_evening  + Thu_evening)    →  75%
--   job9 – Corporate Wellness Coach (Serangoon, Tue_evening)                   → 100%

DO $$
DECLARE
  v_active UUID := 'cc000002-0000-0000-0000-000000000002'; -- active@goodlife.sg
  v_skill_fitness UUID;
BEGIN
  -- ── Part 2: new fitness jobs ────────────────────────────────────────────────
  SELECT id INTO v_skill_fitness
  FROM skills
  WHERE name ILIKE '%fitness%' OR name ILIKE '%training%'
  LIMIT 1;

  IF v_skill_fitness IS NOT NULL THEN

    -- job7: Aqua Fitness Instructor – Serangoon, Tue_afternoon + Thu_afternoon
    IF NOT EXISTS (
      SELECT 1 FROM jobs WHERE creator_id = v_active AND title = 'Aqua Fitness Instructor'
    ) THEN
      WITH inserted AS (
        INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
        VALUES (
          v_active,
          'Aqua Fitness Instructor',
          'Lead low-impact water aerobics sessions for seniors at the community pool. No swimming certification required — just energy and enthusiasm.',
          'Serangoon',
          ARRAY['Tue_afternoon', 'Thu_afternoon'],
          8,
          'open'
        )
        RETURNING id
      )
      INSERT INTO job_skills (job_id, skill_id, min_proficiency)
      SELECT id, v_skill_fitness, 2 FROM inserted;
    END IF;

    -- job8: Weekend Bootcamp Trainer – Bishan, Tue_evening + Thu_evening
    IF NOT EXISTS (
      SELECT 1 FROM jobs WHERE creator_id = v_active AND title = 'Weekend Bootcamp Trainer'
    ) THEN
      WITH inserted AS (
        INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
        VALUES (
          v_active,
          'Weekend Bootcamp Trainer',
          'Run high-energy evening bootcamp circuits for a small group of working adults. Sessions held at the Bishan sports hall.',
          'Bishan',
          ARRAY['Tue_evening', 'Thu_evening'],
          6,
          'open'
        )
        RETURNING id
      )
      INSERT INTO job_skills (job_id, skill_id, min_proficiency)
      SELECT id, v_skill_fitness, 2 FROM inserted;
    END IF;

    -- job9: Corporate Wellness Coach – Serangoon, Tue_evening
    IF NOT EXISTS (
      SELECT 1 FROM jobs WHERE creator_id = v_active AND title = 'Corporate Wellness Coach'
    ) THEN
      WITH inserted AS (
        INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
        VALUES (
          v_active,
          'Corporate Wellness Coach',
          'Deliver weekly wellness workshops and light exercise sessions for office staff. Flexible curriculum — you decide the programme.',
          'Serangoon',
          ARRAY['Tue_evening'],
          12,
          'open'
        )
        RETURNING id
      )
      INSERT INTO job_skills (job_id, skill_id, min_proficiency)
      SELECT id, v_skill_fitness, 1 FROM inserted;
    END IF;

  END IF;

  RAISE NOTICE 'Part 2 done – new fitness jobs inserted (if not already present).';
END;
$$;

-- ── Part 1: patched get_matched_jobs RPC ─────────────────────────────────────
--   Change 1 (applied_jobs CTE): exclude withdrawn_by_jobber so withdrawn jobs
--             resurface in the feed.
--   Change 2 (final SELECT):     filter out zero-score jobs so irrelevant jobs
--             don't pollute the feed.

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
  -- Bug 1 fix: withdrawn applications no longer block a job from reappearing
  applied_jobs AS (
    SELECT a.job_id
    FROM applications a
    WHERE a.jobber_id = p_jobber_id
      AND a.status != 'withdrawn_by_jobber'
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
  -- Bug 2 fix: exclude zero-score jobs (wrong skill + wrong location + wrong slots)
  WHERE (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score) > 0
  ORDER BY (0.5 * s.skill_score + 0.25 * s.location_score + 0.25 * s.availability_score) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
