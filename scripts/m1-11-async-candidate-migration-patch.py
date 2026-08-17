from pathlib import Path

path = Path("database/migrations/0030_worker_evidence_records.up.sql")
text = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)


table_anchor = """CREATE TABLE IF NOT EXISTS worker_employment_leaving_letters (\n"""
table_sql = """CREATE TABLE IF NOT EXISTS worker_evidence_file_candidates (
  candidate_id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL
    REFERENCES worker_evidence_records(record_id),
  version_id TEXT NOT NULL
    REFERENCES worker_evidence_versions(version_id),
  binding_kind TEXT NOT NULL
    CHECK (
      binding_kind IN (
        'primary_certificate',
        'supporting_evidence',
        'experience_evidence',
        'employment_evidence',
        'skill_evidence',
        'leaving_letter'
      )
    ),
  secure_file_id TEXT NOT NULL UNIQUE,
  reservation_key TEXT NOT NULL
    CHECK (reservation_key ~ '^[0-9a-f]{64}$'),
  display_filename TEXT NOT NULL
    CHECK (char_length(display_filename) BETWEEN 1 AND 240),
  expected_active_binding_id TEXT NULL,
  candidate_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (candidate_status IN ('pending', 'finalized')),
  created_at TIMESTAMPTZ NOT NULL,
  finalized_at TIMESTAMPTZ NULL,
  CHECK (
    (candidate_status = 'pending' AND finalized_at IS NULL)
    OR (candidate_status = 'finalized' AND finalized_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS worker_employment_leaving_letters (
"""
replace_once(table_anchor, table_sql, "candidate table")

index_anchor = """CREATE UNIQUE INDEX IF NOT EXISTS worker_employment_leaving_letters_active_idx\n"""
index_sql = """CREATE UNIQUE INDEX IF NOT EXISTS worker_evidence_file_candidates_pending_slot_idx
  ON worker_evidence_file_candidates (record_id, version_id, binding_kind)
  WHERE candidate_status = 'pending';

CREATE INDEX IF NOT EXISTS worker_evidence_file_candidates_record_status_idx
  ON worker_evidence_file_candidates (
    record_id, version_id, candidate_status, created_at
  );

CREATE UNIQUE INDEX IF NOT EXISTS worker_employment_leaving_letters_active_idx
"""
replace_once(index_anchor, index_sql, "candidate indexes")

trigger_anchor = """CREATE OR REPLACE FUNCTION hse_validate_worker_employment_leaving_letter_scope()\n"""
trigger_sql = """CREATE OR REPLACE FUNCTION hse_validate_worker_evidence_file_candidate_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  version_record_id TEXT;
  record_kind_value TEXT;
BEGIN
  SELECT versions.record_id, records.record_kind
    INTO version_record_id, record_kind_value
    FROM worker_evidence_versions AS versions
    JOIN worker_evidence_records AS records
      ON records.record_id = versions.record_id
   WHERE versions.version_id = NEW.version_id;

  IF version_record_id IS NULL OR version_record_id <> NEW.record_id THEN
    RAISE EXCEPTION 'Candidate record and version must match.'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.binding_kind IN ('primary_certificate', 'supporting_evidence')
     AND record_kind_value <> 'qualification' THEN
    RAISE EXCEPTION 'Candidate file type does not belong to this record.'
      USING ERRCODE = '23514';
  ELSIF NEW.binding_kind = 'experience_evidence'
     AND record_kind_value <> 'experience' THEN
    RAISE EXCEPTION 'Candidate file type does not belong to this record.'
      USING ERRCODE = '23514';
  ELSIF NEW.binding_kind IN ('employment_evidence', 'leaving_letter')
     AND record_kind_value <> 'employment' THEN
    RAISE EXCEPTION 'Candidate file type does not belong to this record.'
      USING ERRCODE = '23514';
  ELSIF NEW.binding_kind = 'skill_evidence'
     AND record_kind_value <> 'skill' THEN
    RAISE EXCEPTION 'Candidate file type does not belong to this record.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS worker_evidence_file_candidate_scope_guard
  ON worker_evidence_file_candidates;
CREATE TRIGGER worker_evidence_file_candidate_scope_guard
BEFORE INSERT OR UPDATE OF record_id, version_id, binding_kind
ON worker_evidence_file_candidates
FOR EACH ROW EXECUTE FUNCTION hse_validate_worker_evidence_file_candidate_scope();

CREATE OR REPLACE FUNCTION hse_guard_worker_evidence_file_candidate_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'File candidate history is immutable.'
      USING ERRCODE = '55000';
  END IF;

  IF OLD.candidate_status = 'finalized' THEN
    RAISE EXCEPTION 'Finalized file candidate is immutable.'
      USING ERRCODE = '55000';
  END IF;

  IF NEW.candidate_id IS DISTINCT FROM OLD.candidate_id
     OR NEW.record_id IS DISTINCT FROM OLD.record_id
     OR NEW.version_id IS DISTINCT FROM OLD.version_id
     OR NEW.binding_kind IS DISTINCT FROM OLD.binding_kind
     OR NEW.secure_file_id IS DISTINCT FROM OLD.secure_file_id
     OR NEW.reservation_key IS DISTINCT FROM OLD.reservation_key
     OR NEW.display_filename IS DISTINCT FROM OLD.display_filename
     OR NEW.expected_active_binding_id IS DISTINCT FROM OLD.expected_active_binding_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Candidate identity is immutable.'
      USING ERRCODE = '55000';
  END IF;

  IF NEW.candidate_status <> 'finalized' OR NEW.finalized_at IS NULL THEN
    RAISE EXCEPTION 'Pending file candidate may only transition to finalized.'
      USING ERRCODE = '55000';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS worker_evidence_file_candidate_history_guard
  ON worker_evidence_file_candidates;
CREATE TRIGGER worker_evidence_file_candidate_history_guard
BEFORE UPDATE OR DELETE ON worker_evidence_file_candidates
FOR EACH ROW EXECUTE FUNCTION hse_guard_worker_evidence_file_candidate_history();

CREATE OR REPLACE FUNCTION hse_validate_worker_employment_leaving_letter_scope()
"""
replace_once(trigger_anchor, trigger_sql, "candidate scope/history guards")

path.write_text(text, encoding="utf-8")
print("M1.11 asynchronous candidate migration staged.")
