-- Roll back only clean M2.08 recovery persistence.
-- Recovery/user-authored history is never silently destroyed. The older audit
-- vocabulary is restored NOT VALID so existing M2.08 audit evidence remains readable.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM assessment_attempt_drafts LIMIT 1)
     OR EXISTS (SELECT 1 FROM assessment_attempt_interruptions LIMIT 1)
     OR EXISTS (SELECT 1 FROM assessment_technical_issue_reports LIMIT 1)
     OR EXISTS (SELECT 1 FROM assessment_attempt_recovery_lineage LIMIT 1)
     OR EXISTS (
       SELECT 1
       FROM generated_assessment_forms
       WHERE recovery_source_attempt_id IS NOT NULL
       LIMIT 1
     )
     OR EXISTS (
       SELECT 1
       FROM assessment_attempts
       WHERE status IN ('INTERRUPTED', 'RECOVERABLE')
       LIMIT 1
     ) THEN
    RAISE EXCEPTION
      'Cannot roll back M2.08 while assessment recovery state or history exists.'
      USING ERRCODE = '55000';
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS assessment_attempts_superseded_guard ON assessment_attempts;
DROP FUNCTION IF EXISTS hse_assessment_attempt_superseded_guard();

DROP TRIGGER IF EXISTS assessment_attempt_drafts_validate ON assessment_attempt_drafts;
DROP FUNCTION IF EXISTS hse_assessment_attempt_draft_validate();

DROP TABLE IF EXISTS assessment_attempt_recovery_lineage;
DROP TABLE IF EXISTS assessment_technical_issue_reports;
DROP TABLE IF EXISTS assessment_attempt_interruptions;
DROP TABLE IF EXISTS assessment_attempt_drafts;

ALTER TABLE generated_assessment_forms
  DROP CONSTRAINT IF EXISTS generated_assessment_forms_recovery_source_fk;
DROP INDEX IF EXISTS generated_assessment_forms_recovery_source_uq;
DROP INDEX IF EXISTS generated_assessment_forms_primary_case_blueprint_uq;
ALTER TABLE generated_assessment_forms
  DROP COLUMN IF EXISTS recovery_source_attempt_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'generated_assessment_forms_case_id_blueprint_version_id_key'
  ) THEN
    ALTER TABLE generated_assessment_forms
      ADD CONSTRAINT generated_assessment_forms_case_id_blueprint_version_id_key
      UNIQUE (case_id, blueprint_version_id);
  END IF;
END;
$$;

ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_recovery_form_source_uq;
ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_recovery_lineage_uq;

DROP TRIGGER IF EXISTS assessment_attempts_lifecycle_guard ON assessment_attempts;
DROP FUNCTION IF EXISTS hse_assessment_attempt_lifecycle_guard();

ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_status_check;
ALTER TABLE assessment_attempts
  DROP CONSTRAINT IF EXISTS assessment_attempts_completion_check;

ALTER TABLE assessment_attempts
  ADD CONSTRAINT assessment_attempts_status_check CHECK (
    status IN ('IN_PROGRESS', 'SUBMITTED')
  );
ALTER TABLE assessment_attempts
  ADD CONSTRAINT assessment_attempts_completion_check CHECK (
    (
      status = 'IN_PROGRESS'
      AND submitted_at IS NULL
    ) OR (
      status = 'SUBMITTED'
      AND submitted_at IS NOT NULL
      AND current_position = question_count
    )
  );

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
      'assessment.attempt.submitted'
    )
  ) NOT VALID;
