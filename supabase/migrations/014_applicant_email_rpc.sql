-- ================================================================
-- 014_applicant_email_rpc.sql
-- Add get_applicant_email RPC + seed phone numbers for test jobbers
-- ================================================================

-- ----------------------------------------------------------------
-- RPC: creator retrieves a jobber's email for an applicant
-- on one of their own jobs. Returns NULL if caller is not the creator.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_applicant_email(p_application_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_jobber_id UUID;
  v_job_id    UUID;
  v_email     TEXT;
BEGIN
  SELECT jobber_id, job_id
  INTO   v_jobber_id, v_job_id
  FROM   applications
  WHERE  id = p_application_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Only the creator of this job may retrieve the email.
  IF NOT EXISTS (
    SELECT 1 FROM jobs WHERE id = v_job_id AND creator_id = auth.uid()
  ) THEN
    RETURN NULL;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_jobber_id;
  RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ----------------------------------------------------------------
-- Seed phone numbers for test jobbers (no-op if already set)
-- ----------------------------------------------------------------
UPDATE jobber_profiles SET phone_number = '+65 9111 0001'
  WHERE id = 'bb000001-0000-0000-0000-000000000001' AND phone_number = '';

UPDATE jobber_profiles SET phone_number = '+65 9111 0002'
  WHERE id = 'bb000002-0000-0000-0000-000000000002' AND phone_number = '';

UPDATE jobber_profiles SET phone_number = '+65 9111 0003'
  WHERE id = 'bb000003-0000-0000-0000-000000000003' AND phone_number = '';

UPDATE jobber_profiles SET phone_number = '+65 9111 0004'
  WHERE id = 'bb000004-0000-0000-0000-000000000004' AND phone_number = '';

UPDATE jobber_profiles SET phone_number = '+65 9111 0005'
  WHERE id = 'bb000005-0000-0000-0000-000000000005' AND phone_number = '';

UPDATE jobber_profiles SET phone_number = '+65 9111 0006'
  WHERE id = 'bb000006-0000-0000-0000-000000000006' AND phone_number = '';

UPDATE jobber_profiles SET phone_number = '+65 9111 0007'
  WHERE id = 'bb000007-0000-0000-0000-000000000007' AND phone_number = '';
