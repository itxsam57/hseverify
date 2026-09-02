-- Roll back M2.09 Integrity Engine only.

DROP TRIGGER IF EXISTS assessment_integrity_events_immutable_trigger
  ON assessment_integrity_events;
DROP FUNCTION IF EXISTS assessment_integrity_events_immutable_guard();

DROP TABLE IF EXISTS assessment_integrity_events;
DROP TABLE IF EXISTS assessment_integrity_sessions;

ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_integrity_lineage_uq;
