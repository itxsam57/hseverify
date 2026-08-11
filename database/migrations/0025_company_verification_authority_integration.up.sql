-- M1.08: durable Company verification authority integration.
--
-- Existing M1.06 Company files remain active-tenant-only. M1.08 Company
-- application evidence is a distinct, immutable secure-file authority mode and
-- is permitted only for a live Company owner/admin membership attached to an
-- existing verification case. The mode is persisted so SQL authority does not
-- depend on an in-memory TypeScript capability alone.

ALTER TABLE platform_secure_files
  ADD COLUMN IF NOT EXISTS authority_mode TEXT NOT NULL DEFAULT 'active_tenant';

ALTER TABLE platform_secure_files
  DROP CONSTRAINT IF EXISTS platform_secure_file_authority_mode_check;
ALTER TABLE platform_secure_files
  ADD CONSTRAINT platform_secure_file_authority_mode_check CHECK (
    (owner_role = 'company' AND authority_mode IN ('active_tenant', 'company_application')) OR
    (owner_role <> 'company' AND authority_mode = 'active_tenant')
  );

CREATE OR REPLACE FUNCTION platform_secure_file_validate_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  eligible_owner BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM auth_accounts AS accounts
    JOIN auth_account_roles AS roles
      ON roles.account_id = accounts.account_id
     AND roles.role = NEW.owner_role
    WHERE accounts.account_id = NEW.owner_account_id
      AND accounts.account_status = 'active'
  ) INTO eligible_owner;

  IF NOT eligible_owner THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Secure file owner must be an active account with the assigned role.';
  END IF;

  IF NEW.owner_role = 'company' AND NEW.authority_mode = 'active_tenant' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM auth_tenant_memberships AS memberships
      JOIN platform_tenants AS tenants
        ON tenants.tenant_id = memberships.tenant_id
      WHERE memberships.membership_id = NEW.membership_id
        AND memberships.tenant_id = NEW.tenant_id
        AND memberships.account_id = NEW.owner_account_id
        AND memberships.portal_role = 'company'
        AND memberships.membership_status = 'active'
        AND tenants.tenant_status = 'active'
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Company secure file ownership requires the active trusted tenant membership.';
    END IF;
  ELSIF NEW.owner_role = 'company' AND NEW.authority_mode = 'company_application' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM auth_tenant_memberships AS memberships
      JOIN platform_tenants AS tenants
        ON tenants.tenant_id = memberships.tenant_id
      JOIN company_verification_cases AS cases
        ON cases.tenant_id = tenants.tenant_id
      WHERE memberships.membership_id = NEW.membership_id
        AND memberships.tenant_id = NEW.tenant_id
        AND memberships.account_id = NEW.owner_account_id
        AND memberships.portal_role = 'company'
        AND memberships.membership_status = 'active'
        AND memberships.membership_role IN ('owner', 'admin')
        AND tenants.tenant_status IN ('pending', 'active')
        AND cases.current_version_id IS NOT NULL
        AND cases.case_status = 'draft'
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'Company application secure file ownership requires an active verification manager and draft case.';
    END IF;
  ELSIF NEW.owner_role = 'company' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Company secure file authority mode is invalid.';
  ELSIF NEW.authority_mode <> 'active_tenant' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Non-Company secure files cannot use Company application authority.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION platform_secure_file_reject_authority_mode_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.authority_mode IS DISTINCT FROM OLD.authority_mode THEN
    RAISE EXCEPTION USING
      ERRCODE = '55000',
      MESSAGE = 'Secure file authority provenance is immutable.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS platform_secure_files_authority_mode_immutable
  ON platform_secure_files;
CREATE TRIGGER platform_secure_files_authority_mode_immutable
BEFORE UPDATE OF authority_mode ON platform_secure_files
FOR EACH ROW
EXECUTE FUNCTION platform_secure_file_reject_authority_mode_change();

-- Extend the accepted append-only audit vocabulary for the M1.08 lifecycle.
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
      'company_verification.status.changed'
    )
  );

ALTER TABLE platform_audit_events
  DROP CONSTRAINT IF EXISTS platform_audit_events_target_type_check;
ALTER TABLE platform_audit_events
  ADD CONSTRAINT platform_audit_events_target_type_check CHECK (
    target_type IN (
      'account',
      'authentication',
      'session',
      'invitation',
      'mfa_factor',
      'portal',
      'tenant',
      'membership',
      'resource',
      'job',
      'notification',
      'email_delivery',
      'secure_file',
      'worker_identity',
      'company_verification',
      'platform'
    )
  );
