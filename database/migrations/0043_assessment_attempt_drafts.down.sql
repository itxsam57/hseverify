-- M2.08 narrow-scope rollback.
-- Remove only mutable draft state and its cleanup invariant; preserve M2.07 attempts,
-- committed answers, forms, and history.

DROP TRIGGER IF EXISTS assessment_attempt_answers_delete_matching_draft
  ON assessment_attempt_answers;
DROP FUNCTION IF EXISTS hse_m208_delete_matching_committed_draft();
DROP TABLE IF EXISTS assessment_attempt_drafts;
