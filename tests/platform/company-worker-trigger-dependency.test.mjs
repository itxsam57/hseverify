import assert from "node:assert/strict";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import {
  applyPendingMigrations,
  listMigrations,
  rollbackLatestMigration
} from "../../scripts/lib/migrations.mjs";

const NOW = "2026-08-16T12:00:00.000Z";
const FUTURE = "2099-01-01T00:00:00.000Z";
const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m1-10-trigger-dependency",
  sessionSecret: "m1-10-trigger-dependency-session-secret-with-more-than-thirty-two-characters",
  authPepper: "m1-10-trigger-dependency-pepper-with-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};
const oid = (prefix, character) => `${prefix}_${character.repeat(24)}`;

async function seedCompany(database) {
  const company = {
    accountId: "account_m110_trigger_company",
    tenantId: oid("tenant", "T"),
    membershipId: oid("membership", "T"),
    email: "trigger-company@example.com"
  };
  await database.query(
    `INSERT INTO auth_accounts
      (account_id,email_normalized,display_name,account_status,password_hash,email_verified_at,password_set_at,created_at,updated_at)
     VALUES ($1,$2,'Trigger Company','active',$3,$4,$4,$4,$4)`,
    [company.accountId, company.email, "scrypt$16384$8$1$salt$hash", NOW]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id,role,created_at)
     VALUES ($1,'company',$2)`,
    [company.accountId, NOW]
  );
  await database.query(
    `INSERT INTO platform_tenants
      (tenant_id,tenant_type,display_name,tenant_status,created_by_account_id,created_at,updated_at,activated_at)
     VALUES ($1,'company','Trigger Company','active',$2,$3,$3,$3)`,
    [company.tenantId, company.accountId, NOW]
  );
  await database.query(
    `INSERT INTO auth_tenant_memberships
      (membership_id,tenant_id,account_id,portal_role,membership_role,membership_status,created_by_account_id,created_at,updated_at,activated_at)
     VALUES ($1,$2,$3,'company','owner','active',$3,$4,$4,$4)`,
    [company.membershipId, company.tenantId, company.accountId, NOW]
  );
  return company;
}

async function seedUnits(database, company) {
  const siteId = oid("site", "T");
  const departmentId = oid("department", "T");
  await database.query(
    `INSERT INTO company_sites
      (site_id,tenant_id,name,formatted_address,phone,website,email_normalized,registration_number,site_status,revision,created_by_membership_id,created_at,updated_at)
     VALUES ($1,$2,'Trigger Site','Address','+92510000001','https://site.example.com','site@example.com','SITE-T','active',1,$3,$4,$4)`,
    [siteId, company.tenantId, company.membershipId, NOW]
  );
  await database.query(
    `INSERT INTO company_departments
      (department_id,tenant_id,name,formatted_address,phone,website,email_normalized,registration_number,department_status,revision,created_by_membership_id,created_at,updated_at)
     VALUES ($1,$2,'Trigger Department','Address','+92510000002','https://dept.example.com','dept@example.com','DEPT-T','active',1,$3,$4,$4)`,
    [departmentId, company.tenantId, company.membershipId, NOW]
  );
  return { siteId, departmentId };
}

async function seedWorkerWithPermanentId(database) {
  const worker = {
    accountId: "account_m110_trigger_worker",
    email: "trigger-worker@example.com"
  };
  await database.query(
    `INSERT INTO auth_accounts
      (account_id,email_normalized,display_name,account_status,password_hash,email_verified_at,password_set_at,created_at,updated_at)
     VALUES ($1,$2,'Trigger Worker','active',$3,$4,$4,$4,$4)`,
    [worker.accountId, worker.email, "scrypt$16384$8$1$salt$hash", NOW]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id,role,created_at)
     VALUES ($1,'worker',$2)`,
    [worker.accountId, NOW]
  );

  const identityId = oid("worker_identity", "T");
  const versionId = oid("identity_version", "T");
  const checkId = oid("identity_duplicate_check", "T");
  const permanentWorkerId = oid("worker_id", "T");
  await database.query(
    `INSERT INTO worker_identities
      (identity_id,worker_account_id,lifecycle_status,current_version_number,lock_version,created_at,updated_at)
     VALUES ($1,$2,'draft',1,1,$3,$3)`,
    [identityId, worker.accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_versions
      (identity_version_id,identity_id,version_number,parent_version_id,version_kind,version_status,created_by_account_id,created_at,submitted_at)
     VALUES ($1,$2,1,NULL,'initial','submitted',$3,$4,$4)`,
    [versionId, identityId, worker.accountId, NOW]
  );
  for (const [status, lockVersion] of [
    ["submitted", 2],
    ["automated_checks", 3],
    ["manual_review", 4],
    ["verified", 5]
  ]) {
    await database.query(
      `UPDATE worker_identities
       SET lifecycle_status=$2,lock_version=$3
       WHERE identity_id=$1`,
      [identityId, status, lockVersion]
    );
  }
  await database.query(
    `INSERT INTO worker_identity_duplicate_checks
      (check_id,identity_id,identity_version_id,worker_account_id,check_sequence,check_status,created_at)
     VALUES ($1,$2,$3,$4,1,'clear',$5)`,
    [checkId, identityId, versionId, worker.accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_worker_ids
      (permanent_worker_id,identity_id,identity_version_id,worker_account_id,issued_by_component,issued_at)
     VALUES ($1,$2,$3,$4,'identity-assurance',$5)`,
    [permanentWorkerId, identityId, versionId, worker.accountId, NOW]
  );
  return { ...worker, permanentWorkerId };
}

async function warmM110DatabaseGuards(database, company, units, worker) {
  const invitationId = oid("worker_invitation", "I");
  const codeId = oid("company_code", "C");
  await database.query(
    `INSERT INTO company_worker_invitations (
       invitation_id,tenant_id,email_normalized,token_hash,invitation_status,
       site_id,department_id,payment_responsibility,assessment_reference,
       invited_by_membership_id,resend_count,resend_available_at,expires_at,
       created_at,updated_at
     ) VALUES ($1,$2,$3,$4,'pending',$5,$6,'company',NULL,$7,0,$8,$9,$10,$10)`,
    [
      invitationId,
      company.tenantId,
      worker.email,
      "trigger-invitation-hash",
      units.siteId,
      units.departmentId,
      company.membershipId,
      "2026-08-16T12:05:00.000Z",
      "2026-08-17T12:00:00.000Z",
      NOW
    ]
  );
  await database.query(
    `INSERT INTO company_registration_codes (
       code_id,tenant_id,code_hash,code_status,usage_limit,usage_count,
       site_id,department_id,payment_responsibility,assessment_reference,
       created_by_membership_id,expires_at,created_at,updated_at
     ) VALUES ($1,$2,$3,'active',2,0,$4,$5,'worker',NULL,$6,$7,$8,$8)`,
    [
      codeId,
      company.tenantId,
      "trigger-code-hash",
      units.siteId,
      units.departmentId,
      company.membershipId,
      "2026-08-20T12:00:00.000Z",
      NOW
    ]
  );
  await database.query(
    `INSERT INTO company_worker_links (
       link_id,tenant_id,worker_account_id,permanent_worker_id,
       link_source,invitation_id,code_id,link_status,
       site_id,department_id,payment_responsibility,assessment_reference,
       requested_by_membership_id,created_at,updated_at
     ) VALUES ($1,$2,$3,$4,'permanent_worker_id',NULL,NULL,'pending_worker_acceptance',$5,$6,'company',NULL,$7,$8,$8)`,
    [
      oid("company_worker_link", "L"),
      company.tenantId,
      worker.accountId,
      worker.permanentWorkerId,
      units.siteId,
      units.departmentId,
      company.membershipId,
      NOW
    ]
  );
}

test("executed M1.10 cross-brick guards do not materialize rollback-blocking dependencies", async () => {
  const database = await openScriptDatabase(ENV);
  const previous = process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
  process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = "true";
  try {
    await applyPendingMigrations(database, ENV.releaseSha);
    const company = await seedCompany(database);
    const units = await seedUnits(database, company);
    const worker = await seedWorkerWithPermanentId(database);
    await warmM110DatabaseGuards(database, company, units, worker);

    const audit = await database.query(
      `SELECT COUNT(*)::int AS count
       FROM platform_audit_events
       WHERE action_key LIKE 'company_workforce.%'`
    );
    assert.equal(audit.rows[0]?.count, 0, "trigger dependency regression must not be masked by M1.10 audit rollback compatibility");

    const migrationIds = (await listMigrations()).map((migration) => migration.id);
    const authenticationIndex = migrationIds.indexOf("0002_authentication_foundation");
    assert.ok(authenticationIndex >= 0);
    for (const migrationId of migrationIds.slice(authenticationIndex).reverse()) {
      const rolledBack = await rollbackLatestMigration(database, ENV);
      assert.equal(rolledBack, migrationId);
    }
  } finally {
    if (previous === undefined) delete process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
    else process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = previous;
    await database.close();
  }
});
