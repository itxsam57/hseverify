-- M2.07 Candidate Assessment Window.
-- Durable Worker-owned attempts and immutable committed answers over pinned M2.05 form items.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_catalogue_versions_attempt_lineage_uq'
  ) THEN
    ALTER TABLE assessment_catalogue_versions
      ADD CONSTRAINT assessment_catalogue_versions_attempt_lineage_uq
      UNIQUE (catalogue_version_id, blueprint_version_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'generated_assessment_forms_attempt_lineage_uq'
  ) THEN
    ALTER TABLE generated_assessment_forms
      ADD CONSTRAINT generated_assessment_forms_attempt_lineage_uq
      UNIQUE (form_id, case_id, worker_account_id, blueprint_version_id, question_count);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'generated_assessment_form_items_form_item_uq'
  ) THEN
    ALTER TABLE generated_assessment_form_items
      ADD CONSTRAINT generated_assessment_form_items_form_item_uq
      UNIQUE (form_id, form_item_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'generated_assessment_form_items_answer_lineage_uq'
  ) THEN
    ALTER TABLE generated_assessment_form_items
      ADD CONSTRAINT generated_assessment_form_items_answer_lineage_uq
      UNIQUE (form_id, form_item_id, position, question_id, question_version_id);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_question_versions_answer_type_uq'
  ) THEN
    ALTER TABLE assessment_question_versions
      ADD CONSTRAINT assessment_question_versions_answer_type_uq
      UNIQUE (question_id, question_version_id, question_type);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS assessment_attempts (
  attempt_id TEXT PRIMARY KEY CHECK (
    attempt_id ~ '^assessment_attempt_[A-Za-z0-9_-]{24}$'
  ),
  case_id TEXT NOT NULL
    REFERENCES assurance_cases(case_id) ON DELETE RESTRICT,
  worker_account_id TEXT NOT NULL
    REFERENCES auth_accounts(account_id) ON DELETE RESTRICT,
  catalogue_version_id TEXT NOT NULL
    REFERENCES assessment_catalogue_versions(catalogue_version_id) ON DELETE RESTRICT,
  blueprint_version_id TEXT NOT NULL
    REFERENCES assessment_blueprint_versions(blueprint_version_id) ON DELETE RESTRICT,
  form_id TEXT NOT NULL
    REFERENCES generated_assessment_forms(form_id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'SUBMITTED')),
  current_position INTEGER NOT NULL,
  question_count INTEGER NOT NULL CHECK (question_count >= 1 AND question_count <= 500),
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (current_position BETWEEN 1 AND question_count),
  CHECK (
    (status = 'IN_PROGRESS' AND submitted_at IS NULL) OR
    (status = 'SUBMITTED' AND submitted_at IS NOT NULL AND current_position = question_count)
  ),
  UNIQUE (form_id),
  UNIQUE (attempt_id, form_id),
  CONSTRAINT assessment_attempts_catalogue_blueprint_fk
    FOREIGN KEY (catalogue_version_id, blueprint_version_id)
    REFERENCES assessment_catalogue_versions (catalogue_version_id, blueprint_version_id)
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempts_form_lineage_fk
    FOREIGN KEY (form_id, case_id, worker_account_id, blueprint_version_id, question_count)
    REFERENCES generated_assessment_forms (
      form_id, case_id, worker_account_id, blueprint_version_id, question_count
    )
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS assessment_attempts_worker_idx
  ON assessment_attempts (worker_account_id, status, updated_at DESC, attempt_id);
CREATE INDEX IF NOT EXISTS assessment_attempts_case_idx
  ON assessment_attempts (case_id, created_at DESC, attempt_id);

CREATE TABLE IF NOT EXISTS assessment_attempt_answers (
  answer_id TEXT PRIMARY KEY CHECK (
    answer_id ~ '^assessment_answer_[A-Za-z0-9_-]{24}$'
  ),
  attempt_id TEXT NOT NULL,
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
  numeric_value NUMERIC NULL,
  committed_at TIMESTAMPTZ NOT NULL,
  UNIQUE (attempt_id, position),
  CONSTRAINT assessment_attempt_answers_attempt_form_fk
    FOREIGN KEY (attempt_id, form_id)
    REFERENCES assessment_attempts (attempt_id, form_id)
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempt_answers_form_item_fk
    FOREIGN KEY (form_id, form_item_id)
    REFERENCES generated_assessment_form_items (form_id, form_item_id)
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempt_answers_item_lineage_fk
    FOREIGN KEY (form_id, form_item_id, position, question_id, question_version_id)
    REFERENCES generated_assessment_form_items (
      form_id, form_item_id, position, question_id, question_version_id
    )
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempt_answers_question_type_fk
    FOREIGN KEY (question_id, question_version_id, question_type)
    REFERENCES assessment_question_versions (question_id, question_version_id, question_type)
    ON DELETE RESTRICT,
  CHECK (
    (question_type = 'MULTIPLE_CHOICE' AND text_value IS NOT NULL AND boolean_value IS NULL AND numeric_value IS NULL) OR
    (question_type = 'TRUE_FALSE' AND boolean_value IS NOT NULL AND text_value IS NULL AND numeric_value IS NULL) OR
    (question_type IN ('SHORT_TEXT', 'LONG_TEXT') AND text_value IS NOT NULL AND boolean_value IS NULL AND numeric_value IS NULL) OR
    (question_type IN ('INTEGER', 'DECIMAL') AND numeric_value IS NOT NULL AND text_value IS NULL AND boolean_value IS NULL)
  ),
  CHECK (
    question_type <> 'SHORT_TEXT' OR (
      char_length(text_value) BETWEEN 1 AND 2000 AND text_value = btrim(text_value)
    )
  ),
  CHECK (
    question_type <> 'LONG_TEXT' OR (
      char_length(text_value) BETWEEN 1 AND 20000 AND text_value = btrim(text_value)
    )
  ),
  CHECK (
    question_type <> 'MULTIPLE_CHOICE' OR (
      char_length(text_value) >= 1 AND text_value = btrim(text_value)
    )
  ),
  CHECK (
    question_type <> 'INTEGER' OR (
      numeric_value = trunc(numeric_value) AND
      numeric_value BETWEEN -9007199254740991 AND 9007199254740991
    )
  ),
  CHECK (
    question_type <> 'DECIMAL' OR numeric_value::text NOT IN ('NaN', 'Infinity', '-Infinity')
  )
);

CREATE INDEX IF NOT EXISTS assessment_attempt_answers_attempt_idx
  ON assessment_attempt_answers (attempt_id, position);
