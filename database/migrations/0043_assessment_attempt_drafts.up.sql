-- M2.08 Answer Persistence and Interruption Recovery.
-- One mutable server-authoritative draft for the current uncommitted question only.
-- Attempt lifecycle remains IN_PROGRESS | SUBMITTED; committed answers remain append-only.

CREATE TABLE IF NOT EXISTS assessment_attempt_drafts (
  attempt_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  form_item_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0 AND position <= 500),
  question_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (
    question_type IN (
      'MULTIPLE_CHOICE',
      'TRUE_FALSE',
      'SHORT_TEXT',
      'LONG_TEXT',
      'INTEGER',
      'DECIMAL'
    )
  ),
  text_value TEXT NULL,
  boolean_value BOOLEAN NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  latest_mutation_key TEXT NOT NULL CHECK (
    char_length(latest_mutation_key) BETWEEN 1 AND 128
  ),
  latest_mutation_digest CHAR(64) NOT NULL CHECK (
    latest_mutation_digest ~ '^[0-9a-f]{64}$'
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assessment_attempt_drafts_attempt_form_fk
    FOREIGN KEY (attempt_id, form_id)
    REFERENCES assessment_attempts (attempt_id, form_id)
    ON DELETE CASCADE,
  CONSTRAINT assessment_attempt_drafts_item_lineage_fk
    FOREIGN KEY (form_id, form_item_id, position, question_id, question_version_id)
    REFERENCES generated_assessment_form_items (
      form_id, form_item_id, position, question_id, question_version_id
    )
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempt_drafts_question_type_fk
    FOREIGN KEY (question_id, question_version_id, question_type)
    REFERENCES assessment_question_versions (question_id, question_version_id, question_type)
    ON DELETE RESTRICT,
  CHECK (
    (question_type = 'MULTIPLE_CHOICE' AND boolean_value IS NULL) OR
    (question_type = 'TRUE_FALSE' AND text_value IS NULL) OR
    (question_type IN ('SHORT_TEXT', 'LONG_TEXT', 'INTEGER', 'DECIMAL')
      AND text_value IS NOT NULL AND boolean_value IS NULL)
  ),
  CHECK (
    question_type <> 'SHORT_TEXT' OR char_length(text_value) <= 2000
  ),
  CHECK (
    question_type <> 'LONG_TEXT' OR char_length(text_value) <= 20000
  ),
  CHECK (
    question_type NOT IN ('INTEGER', 'DECIMAL') OR char_length(text_value) <= 128
  )
);

CREATE INDEX IF NOT EXISTS assessment_attempt_drafts_updated_idx
  ON assessment_attempt_drafts (updated_at DESC, attempt_id);
