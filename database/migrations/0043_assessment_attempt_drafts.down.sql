-- M2.08 rollback removes only mutable draft-owned schema.
-- M2.07 attempts and committed answers remain intact.

DROP TABLE IF EXISTS assessment_attempt_drafts;
