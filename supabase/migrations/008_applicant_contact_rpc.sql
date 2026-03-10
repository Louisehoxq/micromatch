-- ================================================================
-- 008_applicant_contact_rpc.sql
-- Secure RPC: creator can retrieve a jobber's email for an applicant
-- on one of their own jobs. Returns NULL if caller is not the creator.
-- ================================================================

CREATE OR REPLACE FUNCTION get_applicant_email(p_application_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_email    TEXT;
  v_jobber_id UUID;
  v_job_id    UUID;
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
