-- ================================================================
-- 011_commitment_mock_data.sql
-- Populates remuneration on all jobs and ensures Mei Lin has an
-- accepted application so both rajan@test.sg and meilin@test.sg
-- can test the commitment detail screen.
-- Re-runnable: all inserts use ON CONFLICT DO NOTHING
-- ================================================================

DO $$
DECLARE
  v_makan   UUID := 'cc000001-0000-0000-0000-000000000001';
  v_active  UUID := 'cc000002-0000-0000-0000-000000000002';
  v_meilin  UUID := 'bb000001-0000-0000-0000-000000000001';

  v_job1 UUID; v_job2 UUID; v_job3 UUID;
  v_job4 UUID; v_job5 UUID; v_job6 UUID;
BEGIN

  -- ── Look up job IDs ──────────────────────────────────────────
  SELECT id INTO v_job1 FROM jobs WHERE creator_id = v_makan AND title = 'Home Cook for Family'    LIMIT 1;
  SELECT id INTO v_job2 FROM jobs WHERE creator_id = v_makan AND title = 'Weekly Meal Prep'        LIMIT 1;
  SELECT id INTO v_job3 FROM jobs WHERE creator_id = v_makan AND title = 'Baking Assistant'        LIMIT 1;
  SELECT id INTO v_job4 FROM jobs WHERE creator_id = v_active AND title = 'Senior Fitness Classes' LIMIT 1;
  SELECT id INTO v_job5 FROM jobs WHERE creator_id = v_active AND title = 'Personal Trainer'       LIMIT 1;
  SELECT id INTO v_job6 FROM jobs WHERE creator_id = v_active AND title = 'Primary School Tutor'   LIMIT 1;

  -- ── Set remuneration on all jobs ────────────────────────────
  UPDATE jobs SET remuneration_per_hour_min = 12, remuneration_per_hour_max = 16 WHERE id = v_job1;
  UPDATE jobs SET remuneration_per_hour_min = 13, remuneration_per_hour_max = 17 WHERE id = v_job2;
  UPDATE jobs SET remuneration_per_hour_min = 10, remuneration_per_hour_max = 14 WHERE id = v_job3;
  UPDATE jobs SET remuneration_per_hour_min = 15, remuneration_per_hour_max = 20 WHERE id = v_job4;
  UPDATE jobs SET remuneration_per_hour_min = 18, remuneration_per_hour_max = 25 WHERE id = v_job5;
  UPDATE jobs SET remuneration_per_hour_min = 20, remuneration_per_hour_max = 28 WHERE id = v_job6;

  -- ── Give Mei Lin an accepted application (Home Cook for Family) ──
  -- She already has under_review on job1 — update it to accepted
  UPDATE applications
  SET status = 'accepted', updated_at = now()
  WHERE job_id = v_job1 AND jobber_id = v_meilin;

  RAISE NOTICE '011_commitment_mock_data: done.';
  RAISE NOTICE 'Remuneration set on all 6 jobs.';
  RAISE NOTICE 'Mei Lin application on job1 set to accepted.';
END $$;
