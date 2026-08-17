-- Logical rollback for M1.12 concern evidence.
--
-- Candidate/binding behavior is removed and the accepted M1.06 secure-file insert
-- guard is restored exactly. The disabled non-login compatibility principal and
-- its anti-authentication guards intentionally remain if 0032 ever wrote immutable
-- platform_secure_files rows: the M1.06 owner foreign key requires that principal
-- to survive, while the restored insert guard prevents any new file from using it.

DROP TRIGGER IF EXISTS public_verification_concern_evidence_scan_finalize
  ON platform_secure_files;
DROP FUNCTION IF EXISTS hse_finalize_public_verification_concern_evidence();

DROP TRIGGER IF EXISTS public_verification_concern_evidence_candidate_guard
  ON public_verification_concern_evidence_candidates;
DROP FUNCTION IF EXISTS hse_guard_public_verification_concern_evidence_candidate();
DROP INDEX IF EXISTS public_verification_concern_evidence_one_bound_idx;
DROP INDEX IF EXISTS public_verification_concern_evidence_candidates_concern_idx;
DROP TABLE IF EXISTS public_verification_concern_evidence_candidates;

-- Restore the exact accepted M1.06 owner validation. This removes the only path
-- that could create a new system-owned secure file after logical rollback.
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

  IF NEW.owner_role = 'company' AND NOT EXISTS (
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

  RETURN NEW;
END;
$$;
