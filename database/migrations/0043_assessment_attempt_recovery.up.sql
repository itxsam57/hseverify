-- M2.08 Answer Persistence and Interruption Recovery.
-- Mutable recovery state remains separate from immutable M2.07 committed answers.

ALTER TABLE platform_audit_events
  DROP CONSTRAINT IF EXISTS platform_audit_events_action_key_check;

ALTER TABLE platform_audit_events
  ADD CONSTRAINT platform_audit_events_action_key_check CHECK (
    action_key IN (
      'authentication.registration.started',
      'authentication.otp.issued',
      'authentication.otp.failed',
      'authentication.otp.verified',
      'authentication.password.created',
      'authentication.password_reset.requested',
      'authentication.password_reset.completed',
      'authentication.login.failed',
      'authentication.login.succeeded',
      'authentication.logout',
      'authentication.session.revoked',
      'authentication.account.locked',
      'authentication.account.unlocked',
      'authentication.invitation.created',
      'authentication.invitation.accepted',
      'authentication.mfa.enrolled',
      'authentication.mfa.failed',
      'authentication.mfa.succeeded',
      'authorization.access.denied',
      'outbox.job.enqueued',
      'outbox.job.claimed',
      'outbox.job.lease_reclaimed',
      'outbox.job.succeeded',
      'outbox.job.retry_scheduled',
      'outbox.job.terminal_failed',
      'notification.projected',
      'notification.read',
      'notification.deep_link.denied',
      'email.delivery.queued',
      'email.delivery.attempt.started',
      'email.delivery.delivered',
      'email.delivery.retry_scheduled',
      'email.delivery.terminal_failed',
      'secure_file.quarantined',
      'secure_file.scan.queued',
      'secure_file.scan.available',
      'secure_file.scan.unsafe',
      'secure_file.scan.failed',
      'secure_file.access.authorized',
      'secure_file.access.served',
      'worker_identity.created',
      'worker_identity.status.changed',
      'worker_identity.duplicate.evaluated',
      'worker_identity.duplicate.disposition.recorded',
      'worker_identity.worker_id.issued',
      'company_verification.updated',
      'company_verification.evidence.bound',
      'company_verification.submitted',
      'company_verification.withdrawn',
      'company_verification.status.changed',
      'company_organization.created',
      'company_organization.updated',
      'company_organization.archived',
      'company_organization.restored',
      'company_team.invitation.created',
      'company_team.invitation.revoked',
      'company_team.membership.updated',
      'company_team.membership.suspended',
      'company_team.membership.reactivated',
      'company_team.membership.revoked',
      'company_workforce.invitation.created',
      'company_workforce.invitation.resent',
      'company_workforce.invitation.revoked',
      'company_workforce.invitation.accepted',
      'company_workforce.code.created',
      'company_workforce.code.revoked',
      'company_workforce.code.redeemed',
      'company_workforce.link.requested',
      'company_workforce.link.accepted',
      'company_workforce.link.revoked',
      'worker_evidence.record.created',
      'worker_evidence.draft.saved',
      'worker_evidence.file.attached',
      'worker_evidence.file.replaced',
      'worker_evidence.version.submitted',
      'worker_evidence.revision.started',
      'worker_evidence.employment.ended',
      'worker_evidence.skill.inactivated',
      'worker_evidence.leaving_letter.attached',
      'worker_evidence.leaving_letter.replaced',
      'public_verification.concern.received',
      'assurance_order.created',
      'assurance_order.updated',
      'assurance_order.validated',
      'assurance_order.submitted',
      'assurance_order.cancelled',
      'assurance_case.created',
      'assurance_case.status.changed',
      'assurance_action.created',
      'assurance_action.assigned',
      'assurance_action.acknowledged',
      'assurance_action.snoozed',
      'assessment.question.created',
      'assessment.question.revised',
      'assessment.question.status.changed',
      'assessment.blueprint.created',
      'assessment.blueprint.revised',
      'assessment.blueprint.status.changed',
      'assessment.form.generated',
      'assessment.catalogue.created',
      'assessment.catalogue.revised',
      'assessment.catalogue.status.changed',
      'assessment.attempt.started',
      'assessment.attempt.submitted',
      'assessment.attempt.interrupted',
      'assessment.technical_issue.reported',
      'assessment.attempt.recovery.eligible',
      'assessment.attempt.resumed',
      'assessment.attempt.replacement.created',
      'assessment.attempt.recovery.failed'
    )
  );

ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_status_check;
ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_check;
ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_completion_check;

ALTER TABLE assessment_attempts
  ADD CONSTRAINT assessment_attempts_status_check CHECK (
    status IN ('IN_PROGRESS', 'INTERRUPTED', 'RECOVERABLE', 'SUBMITTED')
  );
ALTER TABLE assessment_attempts
  ADD CONSTRAINT assessment_attempts_completion_check CHECK (
    (
      status IN ('IN_PROGRESS', 'INTERRUPTED', 'RECOVERABLE')
      AND submitted_at IS NULL
    ) OR (
      status = 'SUBMITTED'
      AND submitted_at IS NOT NULL
      AND current_position = question_count
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_attempts_recovery_lineage_uq'
  ) THEN
    ALTER TABLE assessment_attempts
      ADD CONSTRAINT assessment_attempts_recovery_lineage_uq
      UNIQUE (
        attempt_id,
        case_id,
        worker_account_id,
        catalogue_version_id,
        blueprint_version_id
      );
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_attempts_recovery_form_source_uq'
  ) THEN
    ALTER TABLE assessment_attempts
      ADD CONSTRAINT assessment_attempts_recovery_form_source_uq
      UNIQUE (attempt_id, case_id, worker_account_id, blueprint_version_id);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION hse_assessment_attempt_lifecycle_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'SUBMITTED' AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Submitted assessment attempts are terminal.' USING ERRCODE = '55000';
  END IF;

  IF NEW.current_position < OLD.current_position
     OR NEW.current_position > OLD.current_position + 1 THEN
    RAISE EXCEPTION 'Assessment attempt position transition is invalid.' USING ERRCODE = '55000';
  END IF;

  IF NEW.current_position <> OLD.current_position
     AND (OLD.status <> 'IN_PROGRESS' OR NEW.status <> 'IN_PROGRESS') THEN
    RAISE EXCEPTION 'Assessment attempt position may advance only while in progress.' USING ERRCODE = '55000';
  END IF;

  IF NEW.status <> OLD.status THEN
    IF OLD.status = 'IN_PROGRESS' AND NEW.status IN ('INTERRUPTED', 'SUBMITTED') THEN
      NULL;
    ELSIF OLD.status = 'INTERRUPTED' AND NEW.status = 'RECOVERABLE' THEN
      NULL;
    ELSIF OLD.status = 'RECOVERABLE' AND NEW.status = 'IN_PROGRESS' THEN
      NULL;
    ELSE
      RAISE EXCEPTION 'Assessment attempt lifecycle transition is invalid.' USING ERRCODE = '55000';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessment_attempts_lifecycle_guard ON assessment_attempts;
CREATE TRIGGER assessment_attempts_lifecycle_guard
BEFORE UPDATE ON assessment_attempts
FOR EACH ROW
EXECUTE FUNCTION hse_assessment_attempt_lifecycle_guard();

CREATE TABLE IF NOT EXISTS assessment_attempt_drafts (
  attempt_id TEXT PRIMARY KEY
    REFERENCES assessment_attempts(attempt_id) ON DELETE RESTRICT,
  form_id TEXT NOT NULL,
  form_item_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position > 0 AND position <= 500),
  question_id TEXT NOT NULL
    REFERENCES assessment_questions(question_id) ON DELETE RESTRICT,
  question_version_id TEXT NOT NULL
    REFERENCES assessment_question_versions(question_version_id) ON DELETE RESTRICT,
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
    char_length(latest_mutation_key) BETWEEN 16 AND 160
    AND latest_mutation_key = btrim(latest_mutation_key)
  ),
  latest_mutation_digest TEXT NOT NULL CHECK (
    char_length(latest_mutation_digest) = 64
    AND latest_mutation_digest ~ '^[a-f0-9]{64}$'
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT assessment_attempt_drafts_attempt_form_fk
    FOREIGN KEY (attempt_id, form_id)
    REFERENCES assessment_attempts (attempt_id, form_id)
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempt_drafts_form_item_fk
    FOREIGN KEY (form_id, form_item_id)
    REFERENCES generated_assessment_form_items (form_id, form_item_id)
    ON DELETE RESTRICT,
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
    (
      question_type = 'MULTIPLE_CHOICE'
      AND boolean_value IS NULL
    ) OR (
      question_type = 'TRUE_FALSE'
      AND text_value IS NULL
    ) OR (
      question_type IN ('SHORT_TEXT', 'LONG_TEXT', 'INTEGER', 'DECIMAL')
      AND text_value IS NOT NULL
      AND boolean_value IS NULL
    )
  ),
  CHECK (
    question_type <> 'SHORT_TEXT'
    OR char_length(text_value) <= 2000
  ),
  CHECK (
    question_type <> 'LONG_TEXT'
    OR char_length(text_value) <= 20000
  ),
  CHECK (
    question_type NOT IN ('INTEGER', 'DECIMAL')
    OR char_length(text_value) <= 128
  )
);

CREATE OR REPLACE FUNCTION hse_assessment_attempt_draft_validate()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  option_is_valid BOOLEAN;
BEGIN
  IF NEW.question_type = 'MULTIPLE_CHOICE' AND NEW.text_value IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM assessment_question_versions v,
           jsonb_array_elements_text(v.options_json) AS option_value(value)
      WHERE v.question_id = NEW.question_id
        AND v.question_version_id = NEW.question_version_id
        AND option_value.value = NEW.text_value
    ) INTO option_is_valid;

    IF option_is_valid IS NOT TRUE THEN
      RAISE EXCEPTION 'Assessment draft option is not part of the pinned question.' USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessment_attempt_drafts_validate ON assessment_attempt_drafts;
CREATE TRIGGER assessment_attempt_drafts_validate
BEFORE INSERT OR UPDATE ON assessment_attempt_drafts
FOR EACH ROW
EXECUTE FUNCTION hse_assessment_attempt_draft_validate();

CREATE TABLE IF NOT EXISTS assessment_attempt_interruptions (
  interruption_id TEXT PRIMARY KEY CHECK (
    interruption_id ~ '^assessment_interruption_[A-Za-z0-9_-]{24}$'
  ),
  attempt_id TEXT NOT NULL
    REFERENCES assessment_attempts(attempt_id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0 AND position <= 500),
  question_version_id TEXT NOT NULL
    REFERENCES assessment_question_versions(question_version_id) ON DELETE RESTRICT,
  reason TEXT NOT NULL CHECK (
    reason IN ('EMERGENCY_EXIT', 'TECHNICAL_ISSUE_EXIT')
  ),
  mutation_key TEXT NOT NULL CHECK (
    char_length(mutation_key) BETWEEN 16 AND 160
    AND mutation_key = btrim(mutation_key)
  ),
  mutation_digest TEXT NOT NULL CHECK (
    char_length(mutation_digest) = 64
    AND mutation_digest ~ '^[a-f0-9]{64}$'
  ),
  interrupted_at TIMESTAMPTZ NOT NULL,
  UNIQUE (attempt_id, mutation_key)
);

CREATE INDEX IF NOT EXISTS assessment_attempt_interruptions_attempt_idx
  ON assessment_attempt_interruptions (attempt_id, interrupted_at DESC, interruption_id);

CREATE TABLE IF NOT EXISTS assessment_technical_issue_reports (
  issue_id TEXT PRIMARY KEY CHECK (
    issue_id ~ '^assessment_issue_[A-Za-z0-9_-]{24}$'
  ),
  attempt_id TEXT NOT NULL
    REFERENCES assessment_attempts(attempt_id) ON DELETE RESTRICT,
  position INTEGER NOT NULL CHECK (position > 0 AND position <= 500),
  question_version_id TEXT NOT NULL
    REFERENCES assessment_question_versions(question_version_id) ON DELETE RESTRICT,
  category TEXT NOT NULL CHECK (
    category IN (
      'CONNECTIVITY',
      'DISPLAY_OR_INPUT',
      'BROWSER_OR_DEVICE',
      'ACCESSIBILITY',
      'OTHER'
    )
  ),
  description TEXT NOT NULL CHECK (
    char_length(description) BETWEEN 1 AND 2000
    AND description = btrim(description)
  ),
  mode TEXT NOT NULL CHECK (mode IN ('CONTINUE', 'EXIT')),
  mutation_key TEXT NOT NULL CHECK (
    char_length(mutation_key) BETWEEN 16 AND 160
    AND mutation_key = btrim(mutation_key)
  ),
  mutation_digest TEXT NOT NULL CHECK (
    char_length(mutation_digest) = 64
    AND mutation_digest ~ '^[a-f0-9]{64}$'
  ),
  reported_at TIMESTAMPTZ NOT NULL,
  UNIQUE (attempt_id, mutation_key)
);

CREATE INDEX IF NOT EXISTS assessment_technical_issue_reports_attempt_idx
  ON assessment_technical_issue_reports (attempt_id, reported_at DESC, issue_id);

CREATE TABLE IF NOT EXISTS assessment_attempt_recovery_lineage (
  recovery_id TEXT PRIMARY KEY CHECK (
    recovery_id ~ '^assessment_recovery_[A-Za-z0-9_-]{24}$'
  ),
  predecessor_attempt_id TEXT NOT NULL,
  successor_attempt_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  worker_account_id TEXT NOT NULL,
  catalogue_version_id TEXT NOT NULL,
  blueprint_version_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'FORM_INTEGRITY_FAILURE',
      'FORM_POLICY_INCOMPATIBLE',
      'SERVER_RECOVERY_REQUIRED'
    )
  ),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (predecessor_attempt_id),
  UNIQUE (successor_attempt_id),
  CHECK (predecessor_attempt_id <> successor_attempt_id),
  CONSTRAINT assessment_attempt_recovery_predecessor_fk
    FOREIGN KEY (
      predecessor_attempt_id,
      case_id,
      worker_account_id,
      catalogue_version_id,
      blueprint_version_id
    )
    REFERENCES assessment_attempts (
      attempt_id,
      case_id,
      worker_account_id,
      catalogue_version_id,
      blueprint_version_id
    )
    ON DELETE RESTRICT,
  CONSTRAINT assessment_attempt_recovery_successor_fk
    FOREIGN KEY (
      successor_attempt_id,
      case_id,
      worker_account_id,
      catalogue_version_id,
      blueprint_version_id
    )
    REFERENCES assessment_attempts (
      attempt_id,
      case_id,
      worker_account_id,
      catalogue_version_id,
      blueprint_version_id
    )
    ON DELETE RESTRICT
);

CREATE OR REPLACE FUNCTION hse_assessment_attempt_superseded_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (
    NEW.status <> OLD.status
    OR NEW.current_position <> OLD.current_position
  ) AND EXISTS (
    SELECT 1
    FROM assessment_attempt_recovery_lineage lineage
    WHERE lineage.predecessor_attempt_id = OLD.attempt_id
  ) THEN
    RAISE EXCEPTION 'Superseded assessment attempts cannot progress.' USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessment_attempts_superseded_guard ON assessment_attempts;
CREATE TRIGGER assessment_attempts_superseded_guard
BEFORE UPDATE ON assessment_attempts
FOR EACH ROW
EXECUTE FUNCTION hse_assessment_attempt_superseded_guard();

ALTER TABLE generated_assessment_forms
  ADD COLUMN IF NOT EXISTS recovery_source_attempt_id TEXT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'generated_assessment_forms_recovery_source_fk'
  ) THEN
    ALTER TABLE generated_assessment_forms
      ADD CONSTRAINT generated_assessment_forms_recovery_source_fk
      FOREIGN KEY (
        recovery_source_attempt_id,
        case_id,
        worker_account_id,
        blueprint_version_id
      )
      REFERENCES assessment_attempts (
        attempt_id,
        case_id,
        worker_account_id,
        blueprint_version_id
      )
      ON DELETE RESTRICT;
  END IF;
END;
$$;

ALTER TABLE generated_assessment_forms
  DROP CONSTRAINT IF EXISTS generated_assessment_forms_case_id_blueprint_version_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS generated_assessment_forms_primary_case_blueprint_uq
  ON generated_assessment_forms (case_id, blueprint_version_id)
  WHERE recovery_source_attempt_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS generated_assessment_forms_recovery_source_uq
  ON generated_assessment_forms (recovery_source_attempt_id)
  WHERE recovery_source_attempt_id IS NOT NULL;
