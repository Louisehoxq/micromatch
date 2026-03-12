-- ================================================================
-- 009_jobber_phone.sql
-- Add phone_number to jobber_profiles and expose via secure RPC
-- ================================================================

ALTER TABLE jobber_profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';

-- ----------------------------------------------------------------
-- RPC: creator retrieves a jobber's phone number for an applicant
-- on one of their own jobs. Returns NULL if caller is not the creator.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_applicant_phone(p_application_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_jobber_id UUID;
  v_job_id    UUID;
  v_phone     TEXT;
BEGIN
  SELECT jobber_id, job_id
  INTO   v_jobber_id, v_job_id
  FROM   applications
  WHERE  id = p_application_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Only the creator of this job may retrieve the phone number.
  IF NOT EXISTS (
    SELECT 1 FROM jobs WHERE id = v_job_id AND creator_id = auth.uid()
  ) THEN
    RETURN NULL;
  END IF;

  SELECT phone_number INTO v_phone FROM jobber_profiles WHERE id = v_jobber_id;
  RETURN v_phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
