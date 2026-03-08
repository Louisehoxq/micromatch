-- ================================================================
-- 005_seed_data.sql  –  Self-contained seed (runs in SQL Editor)
-- Creates auth users directly — no manual setup required.
-- Password for ALL test accounts: Test1234!
-- ================================================================

DO $$
DECLARE
  -- Fixed memorable UUIDs (hex digits only: 0-9, a-f)
  v_makan   UUID := 'cc000001-0000-0000-0000-000000000001'; -- makan@goodlife.sg  (creator)
  v_active  UUID := 'cc000002-0000-0000-0000-000000000002'; -- active@goodlife.sg (creator)
  v_meilin  UUID := 'bb000001-0000-0000-0000-000000000001'; -- meilin@test.sg     (jobber)
  v_rajan   UUID := 'bb000002-0000-0000-0000-000000000002'; -- rajan@test.sg      (jobber)
  v_lena    UUID := 'bb000003-0000-0000-0000-000000000003'; -- lena@test.sg       (jobber)

  v_job1 UUID; v_job2 UUID; v_job3 UUID;
  v_job4 UUID; v_job5 UUID; v_job6 UUID;

  v_skill_cooking   UUID;
  v_skill_baking    UUID;
  v_skill_fitness   UUID;
  v_skill_tutoring  UUID;
BEGIN

  -- ── STEP 1: Auth users ───────────────────────────────────────────────────────
  -- The on_auth_user_created trigger auto-creates profiles + jobber_profiles rows.
  INSERT INTO auth.users (
    id, instance_id,
    email, encrypted_password, email_confirmed_at,
    raw_user_meta_data, raw_app_meta_data,
    aud, role,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    (v_makan,  '00000000-0000-0000-0000-000000000000',
     'makan@goodlife.sg',  crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"creator","full_name":"GoodLife Makan"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_active, '00000000-0000-0000-0000-000000000000',
     'active@goodlife.sg', crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"creator","full_name":"GoodLife Active"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_meilin, '00000000-0000-0000-0000-000000000000',
     'meilin@test.sg',     crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"Mei Lin"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_rajan,  '00000000-0000-0000-0000-000000000000',
     'rajan@test.sg',      crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"Rajan Kumar"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', ''),

    (v_lena,   '00000000-0000-0000-0000-000000000000',
     'lena@test.sg',       crypt('Test1234!', gen_salt('bf')), now(),
     '{"role":"jobber","full_name":"Lena Goh"}'::jsonb,
     '{"provider":"email","providers":["email"]}'::jsonb,
     'authenticated', 'authenticated', now(), now(), '', '', '', '')
  ON CONFLICT (id) DO NOTHING;

  -- ── STEP 2: Auth identities (enables email login) ────────────────────────────
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES
    (v_makan,  v_makan,  'makan@goodlife.sg',
     json_build_object('sub', v_makan::text,  'email', 'makan@goodlife.sg',  'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_active, v_active, 'active@goodlife.sg',
     json_build_object('sub', v_active::text, 'email', 'active@goodlife.sg', 'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_meilin, v_meilin, 'meilin@test.sg',
     json_build_object('sub', v_meilin::text, 'email', 'meilin@test.sg',     'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_rajan,  v_rajan,  'rajan@test.sg',
     json_build_object('sub', v_rajan::text,  'email', 'rajan@test.sg',      'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now()),

    (v_lena,   v_lena,   'lena@test.sg',
     json_build_object('sub', v_lena::text,   'email', 'lena@test.sg',       'email_verified', true, 'phone_verified', false)::jsonb,
     'email', now(), now(), now())
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- ── STEP 3: Set estate on profiles (trigger already created the rows) ─────────
  UPDATE profiles SET estate = 'Tampines'  WHERE id = v_makan;
  UPDATE profiles SET estate = 'Bishan'    WHERE id = v_active;
  UPDATE profiles SET estate = 'Tampines'  WHERE id = v_meilin;
  UPDATE profiles SET estate = 'Serangoon' WHERE id = v_rajan;
  UPDATE profiles SET estate = 'Bishan'    WHERE id = v_lena;

  -- ── STEP 4: Set available_slots on jobber_profiles ────────────────────────────
  UPDATE jobber_profiles
  SET available_slots = ARRAY['Mon_morning','Wed_morning','Fri_morning','Mon_afternoon','Fri_afternoon']
  WHERE id = v_meilin;

  UPDATE jobber_profiles
  SET available_slots = ARRAY['Tue_evening','Thu_evening','Tue_afternoon','Thu_afternoon']
  WHERE id = v_rajan;

  UPDATE jobber_profiles
  SET available_slots = ARRAY['Mon_morning','Tue_morning','Wed_morning','Thu_morning']
  WHERE id = v_lena;

  -- ── STEP 5: Skill lookups ────────────────────────────────────────────────────
  SELECT id INTO v_skill_cooking  FROM skills WHERE name ILIKE '%cook%'                                         LIMIT 1;
  SELECT id INTO v_skill_baking   FROM skills WHERE name ILIKE '%bak%'                                          LIMIT 1;
  SELECT id INTO v_skill_fitness  FROM skills WHERE name ILIKE '%fitness%' OR name ILIKE '%training%'           LIMIT 1;
  SELECT id INTO v_skill_tutoring FROM skills WHERE name ILIKE '%tutor%'                                        LIMIT 1;

  -- ── STEP 5b: Jobber skills ───────────────────────────────────────────────────
  DELETE FROM jobber_skills WHERE jobber_id IN (v_meilin, v_rajan, v_lena);

  IF v_skill_cooking IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency) VALUES (v_meilin, v_skill_cooking, 3);
  END IF;
  IF v_skill_baking IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency) VALUES (v_meilin, v_skill_baking, 2);
  END IF;
  IF v_skill_fitness IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency) VALUES (v_rajan, v_skill_fitness, 3);
  END IF;
  IF v_skill_tutoring IS NOT NULL THEN
    INSERT INTO jobber_skills (jobber_id, skill_id, proficiency) VALUES (v_lena, v_skill_tutoring, 2);
  END IF;

  -- ── STEP 6: Jobs ─────────────────────────────────────────────────────────────

  -- GoodLife Makan jobs (Tampines)
  INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
  VALUES (v_makan, 'Home Cook for Family',
    'Prepare simple meals for a family of 4. Must be comfortable with Chinese and Malay cuisine.',
    'Tampines', ARRAY['Mon_morning','Wed_morning','Fri_morning'], 8, 'open')
  RETURNING id INTO v_job1;

  INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
  VALUES (v_makan, 'Weekly Meal Prep',
    'Batch-cook healthy meals every week. Experience with healthy cooking preferred.',
    'Tampines', ARRAY['Mon_afternoon','Fri_afternoon'], 12, 'open')
  RETURNING id INTO v_job2;

  INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
  VALUES (v_makan, 'Baking Assistant',
    'Help with weekend baking orders. Must be comfortable with pies and cakes.',
    'Tampines', ARRAY['Sat_morning','Sun_morning'], 4, 'open')
  RETURNING id INTO v_job3;

  -- GoodLife Active jobs
  INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
  VALUES (v_active, 'Senior Fitness Classes',
    'Lead gentle exercise classes for seniors aged 60+. CPR certification a plus.',
    'Serangoon', ARRAY['Tue_evening','Thu_evening'], null, 'open')
  RETURNING id INTO v_job4;

  INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
  VALUES (v_active, 'Personal Trainer',
    'One-on-one fitness coaching for seniors. Plan and guide workout sessions.',
    'Bishan', ARRAY['Tue_afternoon','Thu_afternoon'], 6, 'open')
  RETURNING id INTO v_job5;

  INSERT INTO jobs (creator_id, title, description, estate, required_slots, duration_weeks, status)
  VALUES (v_active, 'Primary School Tutor',
    'Tutor primary 3-4 students in English and Math. Patient and encouraging approach required.',
    'Tampines', ARRAY['Mon_morning','Tue_morning'], 10, 'open')
  RETURNING id INTO v_job6;

  -- ── STEP 7: Job skills ───────────────────────────────────────────────────────
  IF v_skill_cooking IS NOT NULL THEN
    INSERT INTO job_skills (job_id, skill_id, min_proficiency) VALUES (v_job1, v_skill_cooking, 2);
    INSERT INTO job_skills (job_id, skill_id, min_proficiency) VALUES (v_job2, v_skill_cooking, 2);
  END IF;
  IF v_skill_baking IS NOT NULL THEN
    INSERT INTO job_skills (job_id, skill_id, min_proficiency) VALUES (v_job3, v_skill_baking, 1);
  END IF;
  IF v_skill_fitness IS NOT NULL THEN
    INSERT INTO job_skills (job_id, skill_id, min_proficiency) VALUES (v_job4, v_skill_fitness, 2);
    INSERT INTO job_skills (job_id, skill_id, min_proficiency) VALUES (v_job5, v_skill_fitness, 2);
  END IF;
  IF v_skill_tutoring IS NOT NULL THEN
    INSERT INTO job_skills (job_id, skill_id, min_proficiency) VALUES (v_job6, v_skill_tutoring, 1);
  END IF;

  -- ── STEP 8: Applications ────────────────────────────────────────────────────
  -- Rajan → Senior Fitness Classes (#4): accepted
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job4, v_rajan, 'accepted')
  ON CONFLICT DO NOTHING;

  -- Lena → Primary School Tutor (#6): pending
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job6, v_lena, 'pending')
  ON CONFLICT DO NOTHING;

  -- Lena → Personal Trainer (#5): rejected
  INSERT INTO applications (job_id, jobber_id, status)
  VALUES (v_job5, v_lena, 'rejected')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully.';
  RAISE NOTICE 'Test accounts (password: Test1234!):';
  RAISE NOTICE '  makan@goodlife.sg  – creator (GoodLife Makan, Tampines)';
  RAISE NOTICE '  active@goodlife.sg – creator (GoodLife Active, Bishan)';
  RAISE NOTICE '  meilin@test.sg     – jobber  (Mei Lin, Tampines)';
  RAISE NOTICE '  rajan@test.sg      – jobber  (Rajan Kumar, Serangoon)';
  RAISE NOTICE '  lena@test.sg       – jobber  (Lena Goh, Bishan)';
  RAISE NOTICE 'Job IDs: job1=%, job2=%, job3=%, job4=%, job5=%, job6=%',
    v_job1, v_job2, v_job3, v_job4, v_job5, v_job6;
END $$;
