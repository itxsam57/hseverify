-- M1.12 optional public concern evidence.
--
-- This migration owns only the concern-to-secure-file candidate/binding layer.
-- M1.06 remains the authority for secure file bytes, quarantine, malware scan and
-- private access. A candidate is accepted only after that lower-brick lifecycle
-- reaches `available`; terminal candidates remain as history and do not prevent
-- a later clean retry from becoming the single bound evidence item.

CREATE TABLE IF NOT EXISTS public_verification_concern_evidence_candidates (
  candidate_id TEXT PRIMARY KEY
    CONSTRAINT public_verification_concern_evidence_candidates_id_check
    CHECK (candidate_id ~ '^public_concern_evidence_[A-Za-z0-9_-]{24}$'),
  concern_id TEXT NOT NULL
    REFERENCES public_verification_concerns(concern_id) ON DELETE RESTRICT,
  secure_file_id TEXT NOT NULL UNIQUE
    REFERENCES platform_secure_files(file_id) ON DELETE RESTRICT,
  candidate_status TEXT NOT NULL DEFAULT 'pending'
    CONSTRAINT public_verification_concern_evidence_candidates_status_check
    CHECK (candidate_status IN ('pending', 'bound', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalized_at TIMESTAMPTZ NULL,
  CONSTRAINT public_verification_concern_evidence_candidates_state_check
    CHECK (
      (candidate_status = 'pending' AND finalized_at IS NULL)
      OR
      (candidate_status IN ('bound', 'rejected') AND finalized_at IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS public_verification_concern_evidence_candidates_concern_idx
  ON public_verification_concern_evidence_candidates (
    concern_id,
    created_at DESC,
    candidate_id
  );

CREATE UNIQUE INDEX IF NOT EXISTS public_verification_concern_evidence_one_bound_idx
  ON public_verification_concern_evidence_candidates (concern_id)
  WHERE candidate_status = 'bound';

CREATE OR REPLACE FUNCTION hse_guard_public_verification_concern_evidence_candidate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  secure_status TEXT;
  concern_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Public verification concern evidence history cannot be deleted.'
      USING ERRCODE = '55000';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.candidate_id <> OLD.candidate_id
       OR NEW.concern_id <> OLD.concern_id
       OR NEW.secure_file_id <> OLD.secure_file_id
       OR NEW.created_at <> OLD.created_at THEN
      RAISE EXCEPTION 'Public verification concern evidence provenance is immutable.'
        USING ERRCODE = '55000';
    END IF;
    IF OLD.candidate_status <> 'pending'
       OR NEW.candidate_status NOT IN ('bound', 'rejected') THEN
      RAISE EXCEPTION 'Public verification concern evidence transition is invalid.'
        USING ERRCODE = '55000';
    END IF;
  END IF;

  SELECT intake_status
    INTO concern_status
    FROM public_verification_concerns
   WHERE concern_id = NEW.concern_id;
  IF concern_status IS DISTINCT FROM 'received' THEN
    RAISE EXCEPTION 'Public verification concern evidence requires a received concern.'
      USING ERRCODE = '55000';
  END IF;

  SELECT lifecycle_status
    INTO secure_status
    FROM platform_secure_files
   WHERE file_id = NEW.secure_file_id;
  IF secure_status IS NULL THEN
    RAISE EXCEPTION 'Public verification concern evidence secure file is missing.'
      USING ERRCODE = '55000';
  END IF;

  IF NEW.candidate_status = 'bound' AND secure_status <> 'available' THEN
    RAISE EXCEPTION 'Public verification concern evidence is not available.'
      USING ERRCODE = '55000';
  END IF;
  IF NEW.candidate_status = 'rejected'
     AND secure_status NOT IN ('unsafe', 'scan_failed') THEN
    RAISE EXCEPTION 'Public verification concern evidence is not terminal.'
      USING ERRCODE = '55000';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS public_verification_concern_evidence_candidate_guard
  ON public_verification_concern_evidence_candidates;
CREATE TRIGGER public_verification_concern_evidence_candidate_guard
BEFORE INSERT OR UPDATE OR DELETE
ON public_verification_concern_evidence_candidates
FOR EACH ROW EXECUTE FUNCTION hse_guard_public_verification_concern_evidence_candidate();
