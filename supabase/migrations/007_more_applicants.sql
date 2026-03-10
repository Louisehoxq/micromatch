-- ================================================================
-- 007_more_applicants.sql  –  Richer applicant data for creator review
-- Adds 4 new jobber accounts + creator profile bios + more applications
-- Re-runnable: all inserts use ON CONFLICT DO NOTHING
-- Password for all new test accounts: Test1234!
-- ================================================================

DO $$
DECLARE
  -- Existing UUIDs from 005_seed_data.sql
  v_makan   UUID := 'cc000001-0000-0000-0000-000000000001';
  v_active  UUID := 'cc000002-0000-0000-0000-000000000002';
  v_meilin  UUID := 'bb000001-0000-0000-0000-000000000001';
  v_rajan   UUID := 'bb000002-0000-0000-0000-000000000002';
  v_lena    UUID := 'bb000003-0000-0000-0000-000000000003';

  -- New jobber UUIDs
  v_siti    UUID := 'bb000004-0000-0000-0000-000000000004'; -- siti@test.sg
  v_david   UUID := 'bb000005-0000-0000-0000-000000000005'; -- david@test.sg
  v_priya   UUID := 'bb000006-0000-0000-0000-000000000006'; -- priya@test.sg
  v_james   UUID := 'bb000007-0000-0000-0000-000000000007'; -- james@test.sg

  -- Job IDs (looked up by title + creator)
  v_job1 UUID; v_job2 UUID; v_job3 UUID;
  v_job4 UUID; v_job5 UUID; v_job6 UUID;

  v_skill_cooking   UUID;
  v_skill_baking    UUID;
  v_skill_fitness   UUID;
  v_skill_tutoring  UUID;
BEGIN

  -- ── STEP 1: Auth users ───────────────────────────────────────────────────────
  INSERT INTO auth.users (
    id, instance_id,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    aud, role,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    (v_siti,  '00000000-0000-0000-0000-000000000000',
     'siti@test.sg',  crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"Siti Rahimah"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_david, '00000000-0000-0000-0000-000000000000',
     'david@test.sg', crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"David Tan"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_priya, '00000000-0000-0000-0000-000000000000',
     'priya@test.sg', crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"Priya Nair"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_james, '00000000-0000-0000-0000-000000000000',
     'james@test.sg', crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"James Lee"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ── STEP 2: Auth identities (enables email login) ────────────────────────────
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (v_siti,  v_siti,  'siti@test.sg',
     json_build_object('sub', v_siti::text,  'email', 'siti@test.sg',  'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_david, v_david, 'david@test.sg',
     json_build_object('sub', v_david::text, 'email', 'david@test.sg', 'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_priya, v_priya, 'priya@test.sg',
     json_build_object('sub', v_priya::text, 'email', 'priya@test.sg', 'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_james, v_james, 'james@test.sg',
     json_build_object('sub', v_james::text, 'email', 'james@test.sg', 'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- ── STEP 3: Set estate on profiles (trigger already created the rows) ─────────
  UPDATE profiles SET estate = 'Tampines'   WHERE id = v_siti;
  UPDATE profiles SET estate = 'Jurong West' WHERE id = v_david;
  UPDATE profiles SET estate = 'Bishan'     WHERE id = v_priya;
  UPDATE profiles SET estate = 'Toa Payoh'  WHERE id = v_james;

  -- ── STEP 4: Skill lookups ────────────────────────────────────────────────────
  SELECT id INTO v_skill_cooking  FROM skills WHERE name ILIKE '%cook%'                               LIMIT 1;
  SELECT id INTO v_skill_baking   FROM skills WHERE name ILIKE '%bak%'                                LIMIT 1;
  SELECT id INTO v_skill_fitness  FROM skills WHERE name ILIKE '%fitness%' OR name ILIKE '%training%' LIMIT 1;
  SELECT id INTO v_skill_tutoring FROM skills WHERE name ILIKE '%tutor%'                              LIMIT 1;

  -- ── STEP 5: Jobber skills for new accounts ───────────────────────────────────
  -- Siti: Cooking prof 3, Baking prof 2
  IF v_skill_cooking IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency)
    VALUES (v_siti, v_skill_cooking, 3) ON CONFLICT DO NOTHING;
  END IF;
  IF v_skill_baking IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency)
    VALUES (v_siti, v_skill_baking, 2) ON CONFLICT DO NOTHING;
  END IF;

  -- David: Cooking prof 2
  IF v_skill_cooking IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency)
    VALUES (v_david, v_skill_cooking, 2) ON CONFLICT DO NOTHING;
  END IF;

  -- Priya: Fitness training prof 2
  IF v_skill_fitness IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency)
    VALUES (v_priya, v_skill_fitness, 2) ON CONFLICT DO NOTHING;
  END IF;

  -- James: Tutoring prof 3
  IF v_skill_tutoring IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency)
    VALUES (v_james, v_skill_tutoring, 3) ON CONFLICT DO NOTHING;
  END IF;

  -- ── STEP 6: Look up job IDs ──────────────────────────────────────────────────
  SELECT id INTO v_job1 FROM jobs WHERE creator_id = v_makan AND title = 'Home Cook for Family'    LIMIT 1;
  SELECT id INTO v_job2 FROM jobs WHERE creator_id = v_makan AND title = 'Weekly Meal Prep'        LIMIT 1;
  SELECT id INTO v_job3 FROM jobs WHERE creator_id = v_makan AND title = 'Baking Assistant'        LIMIT 1;
  SELECT id INTO v_job4 FROM jobs WHERE creator_id = v_active AND title = 'Senior Fitness Classes' LIMIT 1;
  SELECT id INTO v_job5 FROM jobs WHERE creator_id = v_active AND title = 'Personal Trainer'       LIMIT 1;
  SELECT id INTO v_job6 FROM jobs WHERE creator_id = v_active AND title = 'Primary School Tutor'   LIMIT 1;

  -- ── STEP 7: Creator profile bios ────────────────────────────────────────────
  UPDATE creator_profiles
  SET bio = 'We are a community cooking initiative helping families enjoy wholesome, home-cooked meals. Our jobbers bring warmth and skill to every kitchen.',
      contact_number = '91234567'
  WHERE id = v_makan;

  UPDATE creator_profiles
  SET bio = 'GoodLife Active promotes healthy ageing through fitness and education. We connect seniors with passionate trainers and tutors in their neighbourhood.',
      contact_number = '98765432'
  WHERE id = v_active;

  -- ── STEP 8: Applications ────────────────────────────────────────────────────
  -- GoodLife Makan – Job 1: Home Cook for Family
  -- Mei Lin: under_review (update existing pending row if present, else insert)
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job1, v_meilin, 'under_review')
  ON CONFLICT DO NOTHING;

  -- Siti: pending
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job1, v_siti, 'pending')
  ON CONFLICT DO NOTHING;

  -- David: accepted
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job1, v_david, 'accepted')
  ON CONFLICT DO NOTHING;

  -- GoodLife Makan – Job 2: Weekly Meal Prep
  -- Siti: pending
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job2, v_siti, 'pending')
  ON CONFLICT DO NOTHING;

  -- Mei Lin: withdrawn_by_jobber
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job2, v_meilin, 'withdrawn_by_jobber')
  ON CONFLICT DO NOTHING;

  -- David: under_review
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job2, v_david, 'under_review')
  ON CONFLICT DO NOTHING;

  -- GoodLife Makan – Job 3: Baking Assistant
  -- Siti: accepted
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job3, v_siti, 'accepted')
  ON CONFLICT DO NOTHING;

  -- Mei Lin: pending
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job3, v_meilin, 'pending')
  ON CONFLICT DO NOTHING;

  -- GoodLife Active – Job 4: Senior Fitness Classes
  -- Rajan: accepted  (already in DB from 005 — skip)
  -- Priya: pending
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job4, v_priya, 'pending')
  ON CONFLICT DO NOTHING;

  -- James: withdrawn_by_creator
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job4, v_james, 'withdrawn_by_creator')
  ON CONFLICT DO NOTHING;

  -- GoodLife Active – Job 5: Personal Trainer
  -- Lena: withdrawn_by_creator  (already in DB from 005/006 — skip)
  -- Rajan: under_review
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job5, v_rajan, 'under_review')
  ON CONFLICT DO NOTHING;

  -- Priya: pending
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job5, v_priya, 'pending')
  ON CONFLICT DO NOTHING;

  -- GoodLife Active – Job 6: Primary School Tutor
  -- Lena: pending  (already in DB from 005 — skip)
  -- James: under_review
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job6, v_james, 'under_review')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '007_more_applicants: done.';
  RAISE NOTICE 'New test accounts (password: Test1234!):';
  RAISE NOTICE '  siti@test.sg   – jobber (Siti Rahimah, Tampines)';
  RAISE NOTICE '  david@test.sg  – jobber (David Tan, Jurong West)';
  RAISE NOTICE '  priya@test.sg  – jobber (Priya Nair, Bishan)';
  RAISE NOTICE '  james@test.sg  – jobber (James Lee, Toa Payoh)';
END $$;
