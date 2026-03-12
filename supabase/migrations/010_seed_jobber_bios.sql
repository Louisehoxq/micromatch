-- ================================================================
-- 010_seed_jobber_bios.sql
-- Populate bio and phone_number for all seed jobbers so the
-- Applicant Profile screen has content to display.
-- Re-runnable (uses UPDATE with fixed UUIDs).
-- ================================================================

DO $$
DECLARE
  v_meilin UUID := 'bb000001-0000-0000-0000-000000000001';
  v_rajan  UUID := 'bb000002-0000-0000-0000-000000000002';
  v_lena   UUID := 'bb000003-0000-0000-0000-000000000003';
  v_siti   UUID := 'bb000004-0000-0000-0000-000000000004';
  v_david  UUID := 'bb000005-0000-0000-0000-000000000005';
  v_priya  UUID := 'bb000006-0000-0000-0000-000000000006';
  v_james  UUID := 'bb000007-0000-0000-0000-000000000007';
BEGIN

  UPDATE jobber_profiles SET
    bio = 'Experienced home cook passionate about Chinese and Malay cuisine. I have 5 years of experience preparing daily meals for families and enjoy making every meal feel like a treat.',
    phone_number = '91112222'
  WHERE id = v_meilin;

  UPDATE jobber_profiles SET
    bio = 'Certified personal trainer with a focus on senior fitness. I specialise in low-impact exercises that improve mobility, balance, and overall wellbeing for adults aged 55+.',
    phone_number = '92223333'
  WHERE id = v_rajan;

  UPDATE jobber_profiles SET
    bio = 'Patient and encouraging tutor with 3 years of experience helping Primary 3–5 students in English and Maths. I tailor lessons to each child''s learning pace.',
    phone_number = '93334444'
  WHERE id = v_lena;

  UPDATE jobber_profiles SET
    bio = 'Passionate baker and home cook who loves creating wholesome meals and pastries. Comfortable with a wide range of cuisines and always ensures a clean, organised kitchen.',
    phone_number = '94445555'
  WHERE id = v_siti;

  UPDATE jobber_profiles SET
    bio = 'Friendly home cook with a knack for healthy meal prep. I enjoy batch-cooking nutritious dishes that keep families fuelled throughout the week.',
    phone_number = '95556666'
  WHERE id = v_david;

  UPDATE jobber_profiles SET
    bio = 'Energetic group fitness instructor with experience running classes for mixed-age groups. I hold a fitness certification and enjoy motivating others to stay active.',
    phone_number = '96667777'
  WHERE id = v_priya;

  UPDATE jobber_profiles SET
    bio = 'Dedicated tutor specialising in Primary and Secondary school subjects. I have helped over 20 students improve their grades through structured, engaging sessions.',
    phone_number = '97778888'
  WHERE id = v_james;

  RAISE NOTICE '010_seed_jobber_bios: bios and phone numbers updated for all seed jobbers.';
END $$;
