import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";

const runtime = process.env.HSE_COMPANY_WORKFORCE_RUNTIME_DIST;
assert.ok(runtime, "HSE_COMPANY_WORKFORCE_RUNTIME_DIST is required");

const serviceModule = await import(
  pathToFileURL(join(runtime, "company", "company-workforce-service.js")).href
);
const domainModule = await import(
  pathToFileURL(join(runtime, "company", "company-workforce-domain.js")).href
);

const {
  CompanyWorkforceService,
  CompanyWorkforceAccessError,
  CompanyWorkforceConflictError,
  CompanyWorkforceSecretError
} = serviceModule;

const OWNED_MIGRATION = "0028_company_worker_invitations_codes";
const NOW_DATE = new Date("2026-08-16T12:00:00.000Z");
const NOW = NOW_DATE.toISOString();
const FAR_FUTURE = "2099-01-01T00:00:00.000Z";
const PEPPER = "m1-10-company-workforce-test-pepper-with-more-than-thirty-two-characters";

const TEST_ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m1-10-company-workforce-test",
  sessionSecret: "m1-10-company-workforce-session-secret-with-more-than-thirty-two-characters",
  authPepper: PEPPER,
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

function opaqueId(prefix, character) {
  return `${prefix}_${character.repeat(24)}`;
}

function companyPrincipal(context) {
  return Object.freeze({
    accountId: context.accountId,
    sessionId: context.sessionId,
    activeRole: "company",
    accountStatus: "active",
    email: context.email,
    displayName: context.displayName,
    createdAt: NOW,
    lastSeenAt: NOW,
    expiresAt: FAR_FUTURE,
    tenantMembership: {
      tenantId: context.tenantId,
      tenantStatus: "active",
      membershipId: context.membershipId,
      role: context.membershipRole,
      status: "active",
      overrides: []
    },
    authorizedTenantPermission: "company.workforce.manage"
  });
}

function workerPrincipal(context) {
  return Object.freeze({
    accountId: context.accountId,
    sessionId: context.sessionId,
    activeRole: "worker",
    accountStatus: "active",
    email: context.email,
    displayName: context.displayName,
    createdAt: NOW,
    lastSeenAt: NOW,
    expiresAt: FAR_FUTURE,
    tenantMembership: null
  });
}

async function insertCompanyContext(database, character, options = {}) {
  const accountId = `account_m110_company_${character}`;
  const tenantId = opaqueId("tenant", character);
  const membershipId = opaqueId("membership", character);
  const sessionId = `session_m110_company_${character}`;
  const email = `m110-company-${character.toLowerCase()}@example.com`;
  const displayName = `M110 Company ${character}`;
  const membershipRole = options.membershipRole ?? "owner";

  await database.query(
    `INSERT INTO auth_accounts (
       account_id, email_normalized, display_name, account_status,
       password_hash, email_verified_at, password_set_at,
       created_at, updated_at
     ) VALUES ($1,$2,$3,'active',$4,$5,$5,$5,$5)`,
    [accountId, email, displayName, "scrypt$16384$8$1$salt$hash", NOW]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id, role, created_at)
     VALUES ($1,'company',$2)`,
    [accountId, NOW]
  );
  await database.query(
    `INSERT INTO platform_tenants (
       tenant_id, tenant_type, display_name, tenant_status,
       created_by_account_id, created_at, updated_at, activated_at
     ) VALUES ($1,'company',$2,'active',$3,$4,$4,$4)`,
    [tenantId, displayName, accountId, NOW]
  );
  await database.query(
    `INSERT INTO auth_tenant_memberships (
       membership_id, tenant_id, account_id, portal_role,
       membership_role, membership_status, created_by_account_id,
       created_at, updated_at, activated_at
     ) VALUES ($1,$2,$3,'company',$4,'active',$3,$5,$5,$5)`,
    [membershipId, tenantId, accountId, membershipRole, NOW]
  );
  await database.query(
    `INSERT INTO auth_sessions (
       session_id, account_id, active_role, token_hash, csrf_token_hash,
       created_at, last_seen_at, expires_at
     ) VALUES ($1,$2,'company',$3,$4,$5,$5,$6)`,
    [sessionId, accountId, `token-company-${character}`, `csrf-company-${character}`, NOW, FAR_FUTURE]
  );

  const caseId = opaqueId("company_verification", character);
  await database.query(
    `INSERT INTO company_verification_cases (
       case_id, tenant_id, owner_account_id, case_status,
       lock_version, created_at, updated_at, verified_at
     ) VALUES ($1,$2,$3,$4,0,$5,$5,$6)`,
    [
      caseId,
      tenantId,
      accountId,
      options.verified === false ? "draft" : "verified",
      NOW,
      options.verified === false ? null : NOW
    ]
  );

  return {
    accountId,
    tenantId,
    membershipId,
    sessionId,
    email,
    displayName,
    membershipRole,
    caseId
  };
}

async function insertWorkerContext(database, character, email = null) {
  const accountId = `account_m110_worker_${character}`;
  const sessionId = `session_m110_worker_${character}`;
  const normalizedEmail = email ?? `m110-worker-${character.toLowerCase()}@example.com`;
  const displayName = `M110 Worker ${character}`;

  await database.query(
    `INSERT INTO auth_accounts (
       account_id, email_normalized, display_name, account_status,
       password_hash, email_verified_at, phone_verified_at, password_set_at,
       created_at, updated_at
     ) VALUES ($1,$2,$3,'active',$4,$5,$5,$5,$5,$5)`,
    [accountId, normalizedEmail, displayName, "scrypt$16384$8$1$salt$hash", NOW]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id, role, created_at)
     VALUES ($1,'worker',$2)`,
    [accountId, NOW]
  );
  await database.query(
    `INSERT INTO auth_sessions (
       session_id, account_id, active_role, token_hash, csrf_token_hash,
       created_at, last_seen_at, expires_at
     ) VALUES ($1,$2,'worker',$3,$4,$5,$5,$6)`,
    [sessionId, accountId, `token-worker-${character}`, `csrf-worker-${character}`, NOW, FAR_FUTURE]
  );

  return { accountId, sessionId, email: normalizedEmail, displayName };
}

async function insertCompanyUnits(database, company, character) {
  const siteId = opaqueId("site", character);
  const departmentId = opaqueId("department", character);
  await database.query(
    `INSERT INTO company_sites (
       site_id, tenant_id, name, formatted_address, phone, website,
       email_normalized, registration_number, site_status, revision,
       created_by_membership_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',1,$9,$10,$10)`,
    [
      siteId,
      company.tenantId,
      `Site ${character}`,
      `Address ${character}`,
      "+92510000001",
      `https://site-${character.toLowerCase()}.example.com`,
      `site-${character.toLowerCase()}@example.com`,
      `SITE-${character}`,
      company.membershipId,
      NOW
    ]
  );
  await database.query(
    `INSERT INTO company_departments (
       department_id, tenant_id, name, formatted_address, phone, website,
       email_normalized, registration_number, department_status, revision,
       created_by_membership_id, created_at, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',1,$9,$10,$10)`,
    [
      departmentId,
      company.tenantId,
      `Department ${character}`,
      `Department address ${character}`,
      "+92510000002",
      `https://department-${character.toLowerCase()}.example.com`,
      `department-${character.toLowerCase()}@example.com`,
      `DEPT-${character}`,
      company.membershipId,
      NOW
    ]
  );
  return { siteId, departmentId };
}

async function seedPermanentWorkerId(database, worker, character) {
  const identityId = opaqueId("worker_identity", character);
  const versionId = opaqueId("identity_version", character);
  const checkId = opaqueId("identity_duplicate_check", character);
  const permanentWorkerId = opaqueId("worker_id", character);

  await database.query(
    `INSERT INTO worker_identities (
       identity_id, worker_account_id, lifecycle_status,
       current_version_number, lock_version, created_at, updated_at
     ) VALUES ($1,$2,'draft',1,1,$3,$3)`,
    [identityId, worker.accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_versions (
       identity_version_id, identity_id, version_number, parent_version_id,
       version_kind, version_status, created_by_account_id, created_at, submitted_at
     ) VALUES ($1,$2,1,NULL,'initial','submitted',$3,$4,$4)`,
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
       SET lifecycle_status=$2, lock_version=$3
       WHERE identity_id=$1`,
      [identityId, status, lockVersion]
    );
  }
  await database.query(
    `INSERT INTO worker_identity_duplicate_checks (
       check_id, identity_id, identity_version_id, worker_account_id,
       check_sequence, check_status, created_at
     ) VALUES ($1,$2,$3,$4,1,'clear',$5)`,
    [checkId, identityId, versionId, worker.accountId, NOW]
  );
  await database.query(
    `INSERT INTO worker_identity_worker_ids (
       permanent_worker_id, identity_id, identity_version_id,
       worker_account_id, issued_by_component, issued_at
     ) VALUES ($1,$2,$3,$4,'identity-assurance',$5)`,
    [permanentWorkerId, identityId, versionId, worker.accountId, NOW]
  );
  return permanentWorkerId;
}

async function createDatabase() {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  await applyMigrationsThrough(database, TEST_ENVIRONMENT.releaseSha, OWNED_MIGRATION);
  return database;
}

async function storedHash(database, table, idColumn, id, hashColumn) {
  const result = await database.query(
    `SELECT ${hashColumn} AS stored_hash FROM ${table} WHERE ${idColumn}=$1`,
    [id]
  );
  return result.rows[0]?.stored_hash ?? null;
}

const REQUIRED_SERVICE_METHODS = Object.freeze([
  "inviteWorker",
  "bulkInviteWorkers",
  "resendInvitation",
  "revokeInvitation",
  "createRegistrationCode",
  "revokeRegistrationCode",
  "acceptInvitation",
  "redeemRegistrationCode",
  "requestPermanentWorkerLink",
  "acceptWorkerLink"
]);

for (const method of REQUIRED_SERVICE_METHODS) {
  test(`M1.10 service exposes ${method} through one Company↔Worker authority`, () => {
    assert.equal(typeof CompanyWorkforceService?.prototype?.[method], "function");
  });
}

test("M1.10 domain exposes neutral access/conflict/secret errors instead of tenant-enumerating variants", () => {
  for (const name of ["CompanyWorkforceAccessError", "CompanyWorkforceConflictError", "CompanyWorkforceSecretError"]) {
    assert.equal(typeof domainModule[name], "function", `${name} must be exported`);
  }
  assert.equal("CompanyWorkforceCrossTenantError" in domainModule, false);
  assert.equal("CompanyWorkforceUnknownTenantError" in domainModule, false);
});

test("M1.10 domain bounds payment responsibility to Company or Worker", () => {
  assert.deepEqual([...domainModule.COMPANY_WORKFORCE_PAYMENT_RESPONSIBILITIES].sort(), ["company", "worker"]);
});

test("M1.10 invitation lifecycle enforces verified live Company authority, tenant units, hashed rotating secrets and Worker email consent", async () => {
  const database = await createDatabase();
  try {
    const companyA = await insertCompanyContext(database, "A");
    const companyB = await insertCompanyContext(database, "B");
    const unverified = await insertCompanyContext(database, "U", { verified: false });
    const unitsA = await insertCompanyUnits(database, companyA, "A");
    const unitsB = await insertCompanyUnits(database, companyB, "B");
    let clock = new Date(NOW_DATE);
    const service = new CompanyWorkforceService(database, PEPPER, () => new Date(clock));
    const principalA = companyPrincipal(companyA);

    const invite = await service.inviteWorker(principalA, {
      email: "Invited.Worker@Example.com ",
      siteId: unitsA.siteId,
      departmentId: unitsA.departmentId,
      paymentResponsibility: "company",
      assessmentReference: "future-assessment-reference"
    });
    assert.ok(invite.invitationToken.length >= 32);
    assert.match(invite.invitationPath, /^\/worker\/company-invitations\//);
    const firstHash = await storedHash(
      database,
      "company_worker_invitations",
      "invitation_id",
      invite.invitationId,
      "token_hash"
    );
    assert.ok(firstHash);
    assert.notEqual(firstHash, invite.invitationToken);
    const rawLeak = await database.query(
      `SELECT 1 FROM company_worker_invitations WHERE token_hash=$1`,
      [invite.invitationToken]
    );
    assert.equal(rawLeak.rows.length, 0, "raw invitation token must never be persisted");

    await assert.rejects(
      service.inviteWorker(companyPrincipal(unverified), {
        email: "blocked-unverified@example.com",
        siteId: null,
        departmentId: null,
        paymentResponsibility: "worker",
        assessmentReference: null
      }),
      CompanyWorkforceAccessError
    );
    await assert.rejects(
      service.inviteWorker(principalA, {
        email: "cross-tenant@example.com",
        siteId: unitsB.siteId,
        departmentId: null,
        paymentResponsibility: "worker",
        assessmentReference: null
      }),
      CompanyWorkforceAccessError
    );

    await database.query(
      `INSERT INTO auth_tenant_permission_overrides (
         membership_id, membership_role, permission_key, effect,
         created_by_account_id, reason, created_at
       ) VALUES ($1,'owner','company.workforce.manage','deny',$2,$3,$4)`,
      [companyA.membershipId, companyA.accountId, "M1.10 live permission removal", NOW]
    );
    await assert.rejects(
      service.inviteWorker(principalA, {
        email: "stale-principal@example.com",
        siteId: null,
        departmentId: null,
        paymentResponsibility: "worker",
        assessmentReference: null
      }),
      CompanyWorkforceAccessError
    );
    await database.query(
      `DELETE FROM auth_tenant_permission_overrides
       WHERE membership_id=$1 AND permission_key='company.workforce.manage'`,
      [companyA.membershipId]
    );

    await assert.rejects(
      service.resendInvitation(principalA, invite.invitationId),
      CompanyWorkforceConflictError
    );
    clock = new Date(NOW_DATE.getTime() + 6 * 60 * 1000);
    const resent = await service.resendInvitation(principalA, invite.invitationId);
    assert.notEqual(resent.invitationToken, invite.invitationToken);
    const secondHash = await storedHash(
      database,
      "company_worker_invitations",
      "invitation_id",
      invite.invitationId,
      "token_hash"
    );
    assert.notEqual(secondHash, firstHash, "resend must rotate the persisted hash");

    const wrongWorker = await insertWorkerContext(database, "X", "wrong-worker@example.com");
    await assert.rejects(
      service.acceptInvitation(workerPrincipal(wrongWorker), resent.invitationToken),
      CompanyWorkforceSecretError
    );
    const matchingWorker = await insertWorkerContext(
      database,
      "M",
      "invited.worker@example.com"
    );
    const link = await service.acceptInvitation(
      workerPrincipal(matchingWorker),
      resent.invitationToken
    );
    assert.equal(link.status, "active");
    assert.equal(link.tenantId, companyA.tenantId);
    assert.equal(link.workerAccountId, matchingWorker.accountId);
    assert.equal(link.siteId, unitsA.siteId);
    assert.equal(link.departmentId, unitsA.departmentId);
    assert.equal(link.paymentResponsibility, "company");

    const repeated = await service.acceptInvitation(
      workerPrincipal(matchingWorker),
      resent.invitationToken
    );
    assert.equal(repeated.linkId, link.linkId, "repeated acceptance must be idempotent");
    await assert.rejects(
      service.acceptInvitation(workerPrincipal(matchingWorker), invite.invitationToken),
      CompanyWorkforceSecretError,
      "rotated invitation token must not remain valid"
    );
  } finally {
    await database.close();
  }
});

test("M1.10 Company codes enforce hash-only storage, atomic usage limits, idempotent same-Worker redemption and revoke", async () => {
  const database = await createDatabase();
  try {
    const company = await insertCompanyContext(database, "C");
    const units = await insertCompanyUnits(database, company, "C");
    const service = new CompanyWorkforceService(database, PEPPER, () => new Date(NOW_DATE));
    const principal = companyPrincipal(company);
    const workerOne = await insertWorkerContext(database, "1");
    const workerTwo = await insertWorkerContext(database, "2");

    const code = await service.createRegistrationCode(principal, {
      usageLimit: 1,
      expiresAt: "2026-08-20T12:00:00.000Z",
      siteId: units.siteId,
      departmentId: null,
      paymentResponsibility: "worker",
      assessmentReference: null
    });
    const codeHash = await storedHash(
      database,
      "company_registration_codes",
      "code_id",
      code.codeId,
      "code_hash"
    );
    assert.ok(codeHash);
    assert.notEqual(codeHash, code.registrationCode);

    const first = await service.redeemRegistrationCode(
      workerPrincipal(workerOne),
      code.registrationCode
    );
    assert.equal(first.status, "active");
    const repeated = await service.redeemRegistrationCode(
      workerPrincipal(workerOne),
      code.registrationCode
    );
    assert.equal(repeated.linkId, first.linkId);

    const usage = await database.query(
      `SELECT usage_count, usage_limit, code_status
       FROM company_registration_codes WHERE code_id=$1`,
      [code.codeId]
    );
    assert.deepEqual(usage.rows[0], {
      usage_count: 1,
      usage_limit: 1,
      code_status: "exhausted"
    });
    await assert.rejects(
      service.redeemRegistrationCode(workerPrincipal(workerTwo), code.registrationCode),
      CompanyWorkforceSecretError
    );

    const revocable = await service.createRegistrationCode(principal, {
      usageLimit: 2,
      expiresAt: "2026-08-20T12:00:00.000Z",
      siteId: null,
      departmentId: null,
      paymentResponsibility: "company",
      assessmentReference: null
    });
    await service.revokeRegistrationCode(principal, revocable.codeId);
    await service.revokeRegistrationCode(principal, revocable.codeId);
    await assert.rejects(
      service.redeemRegistrationCode(workerPrincipal(workerTwo), revocable.registrationCode),
      CompanyWorkforceSecretError
    );
  } finally {
    await database.close();
  }
});

test("M1.10 code usage remains atomic when two Workers race for the last slot", async () => {
  const database = await createDatabase();
  try {
    const company = await insertCompanyContext(database, "R");
    const service = new CompanyWorkforceService(database, PEPPER, () => new Date(NOW_DATE));
    const code = await service.createRegistrationCode(companyPrincipal(company), {
      usageLimit: 1,
      expiresAt: "2026-08-20T12:00:00.000Z",
      siteId: null,
      departmentId: null,
      paymentResponsibility: "worker",
      assessmentReference: null
    });
    const workerOne = await insertWorkerContext(database, "3");
    const workerTwo = await insertWorkerContext(database, "4");

    const results = await Promise.allSettled([
      service.redeemRegistrationCode(workerPrincipal(workerOne), code.registrationCode),
      service.redeemRegistrationCode(workerPrincipal(workerTwo), code.registrationCode)
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    const stored = await database.query(
      `SELECT usage_count, code_status FROM company_registration_codes WHERE code_id=$1`,
      [code.codeId]
    );
    assert.equal(stored.rows[0].usage_count, 1);
    assert.equal(stored.rows[0].code_status, "exhausted");
  } finally {
    await database.close();
  }
});

test("M1.10 permanent Worker-ID linking preserves Worker identity ownership and requires Worker consent", async () => {
  const database = await createDatabase();
  try {
    const company = await insertCompanyContext(database, "P");
    const service = new CompanyWorkforceService(database, PEPPER, () => new Date(NOW_DATE));
    const worker = await insertWorkerContext(database, "P");
    const otherWorker = await insertWorkerContext(database, "Q");
    const permanentWorkerId = await seedPermanentWorkerId(database, worker, "P");

    const requested = await service.requestPermanentWorkerLink(
      companyPrincipal(company),
      permanentWorkerId,
      {
        email: worker.email,
        siteId: null,
        departmentId: null,
        paymentResponsibility: "company",
        assessmentReference: "future-reference"
      }
    );
    assert.equal(requested.status, "pending_worker_acceptance");
    assert.equal(requested.workerAccountId, worker.accountId);
    assert.equal(requested.permanentWorkerId, permanentWorkerId);

    await assert.rejects(
      service.acceptWorkerLink(workerPrincipal(otherWorker), requested.linkId),
      CompanyWorkforceAccessError
    );
    const accepted = await service.acceptWorkerLink(
      workerPrincipal(worker),
      requested.linkId
    );
    assert.equal(accepted.status, "active");
    const repeated = await service.acceptWorkerLink(
      workerPrincipal(worker),
      requested.linkId
    );
    assert.equal(repeated.linkId, accepted.linkId);

    await assert.rejects(
      service.requestPermanentWorkerLink(
        companyPrincipal(company),
        opaqueId("worker_id", "Z"),
        {
          email: worker.email,
          siteId: null,
          departmentId: null,
          paymentResponsibility: "worker",
          assessmentReference: null
        }
      ),
      CompanyWorkforceAccessError
    );
  } finally {
    await database.close();
  }
});

test("M1.10 bulk invitation returns deterministic per-row results and never hides malformed or duplicate rows", async () => {
  const database = await createDatabase();
  try {
    const company = await insertCompanyContext(database, "L");
    const service = new CompanyWorkforceService(database, PEPPER, () => new Date(NOW_DATE));
    const rows = await service.bulkInviteWorkers(companyPrincipal(company), [
      {
        email: "bulk-one@example.com",
        siteId: null,
        departmentId: null,
        paymentResponsibility: "worker",
        assessmentReference: null
      },
      {
        email: "not-an-email",
        siteId: null,
        departmentId: null,
        paymentResponsibility: "worker",
        assessmentReference: null
      },
      {
        email: " BULK-ONE@EXAMPLE.COM ",
        siteId: null,
        departmentId: null,
        paymentResponsibility: "worker",
        assessmentReference: null
      }
    ]);
    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((row) => row.rowNumber), [1, 2, 3]);
    assert.equal(rows[0].status, "created");
    assert.equal(rows[1].status, "error");
    assert.equal(rows[2].status, "error");
    const stored = await database.query(
      `SELECT email_normalized FROM company_worker_invitations
       WHERE tenant_id=$1 ORDER BY email_normalized`,
      [company.tenantId]
    );
    assert.deepEqual(stored.rows.map((row) => row.email_normalized), ["bulk-one@example.com"]);
  } finally {
    await database.close();
  }
});
