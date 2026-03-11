-- ================================================================
-- 012_offer_signing_flow.sql
-- Adds 'offer_pending' status: creator accepts → offer_pending,
-- jobber signs → accepted. Also seeds Rajan with an offer_pending
-- application on Personal Trainer so the full signing flow is
-- immediately testable as rajan@test.sg.
-- Re-runnable: UPDATE uses WHERE clauses; DROP CONSTRAINT uses IF EXISTS
-- ================================================================

-- ── 1. Extend the status CHECK constraint ───────────────────────
ALTER TABLE applications
  DROP CONSTRAINT IF EXISTS applications_status_check,
  DROP CONSTRAINT IF EXISTS applications_status_new_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'pending',
    'under_review',
    'offer_pending',
    'accepted',
    'withdrawn_by_creator',
    'withdrawn_by_jobber'
  ));

-- ── 2. Seed: give Rajan an offer_pending on Personal Trainer ────
DO $$
DECLARE
  v_active UUID := 'cc000002-0000-0000-0000-000000000002';
  v_rajan  UUID := 'bb000002-0000-0000-0000-000000000002';
  v_job5   UUID;
BEGIN
  SELECT id INTO v_job5
    FROM jobs
   WHERE creator_id = v_active AND title = 'Personal Trainer'
   LIMIT 1;

  UPDATE applications
     SET status = 'offer_pending', updated_at = now()
   WHERE job_id = v_job5 AND jobber_id = v_rajan;

  RAISE NOTICE '012_offer_signing_flow: done.';
  RAISE NOTICE 'Rajan Personal Trainer application → offer_pending.';
END $$;
