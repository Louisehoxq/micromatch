-- ================================================================
-- 015_contracts.sql
-- Contracts table: stores auto-generated terms + signing timestamps
-- ================================================================

CREATE TABLE contracts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID        UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  terms             TEXT        NOT NULL,
  creator_signed_at TIMESTAMPTZ,
  jobber_signed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Creator of the job: full access (insert + select + update)
CREATE POLICY "creator_access" ON contracts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE a.id = contracts.application_id
        AND j.creator_id = auth.uid()
    )
  );

-- Jobber of the application: read-only
CREATE POLICY "jobber_read" ON contracts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = contracts.application_id AND jobber_id = auth.uid()
    )
  );

-- Jobber can update to set jobber_signed_at
CREATE POLICY "jobber_sign" ON contracts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE id = contracts.application_id AND jobber_id = auth.uid()
    )
  );
