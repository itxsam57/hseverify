from pathlib import Path

path = Path("database/migrations/0030_worker_evidence_records.up.sql")
source = path.read_text(encoding="utf-8")

old = '''CREATE UNIQUE INDEX IF NOT EXISTS worker_evidence_file_candidates_pending_slot_idx
  ON worker_evidence_file_candidates (record_id, version_id, binding_kind)
  WHERE candidate_status = 'pending';

'''

if source.count(old) != 1:
    raise SystemExit(
        f"expected exactly one pending-slot unique index block, found {source.count(old)}"
    )

source = source.replace(old, "", 1)
path.write_text(source, encoding="utf-8")
print("M1.11 failed/stalled candidate retry fix staged.")
