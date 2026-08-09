import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyPendingMigrations, listMigrations } from "../../scripts/lib/migrations.mjs";

const ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "email-delivery-foundation-test",
  sessionSecret: "email-delivery-foundation-session-secret-32-characters",
  authPepper: "email-delivery-foundation-auth-pepper-32-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

function opaque(prefix, character) {
  return `${prefix}_${character.repeat(24)}`;
}

function hash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function extractSql(source, name) {
  const prefix = `export const ${name} = \``;
  const start = source.indexOf(prefix);
  assert.notEqual(start, -1, `${name} must be extractable`);
  const contentStart = start + prefix.length;
  const end = source.indexOf("`;", contentStart);
  assert.notEqual(end, -1, `${name} SQL terminator must be extractable`);
  return source.slice(contentStart, end);
}

async function contracts() {
  const source = await readFile(
    resolve("src/lib/email-delivery/email-delivery-repository.ts"),
    "utf8"
  );
  return {
    queue: extractSql(source, "EMAIL_QUEUE_SQL"),
    findJob: extractSql(source, "EMAIL_FIND_BY_JOB_SQL"),
    reconcileAttempts: extractSql(source, "EMAIL_RECONCILE_EXPIRED_ATTEMPTS_SQL"),
    reconcileDelivery: extractSql(source, "EMAIL_RECONCILE_DELIVERY_SQL"),
    insertAttempt: extractSql(source, "EMAIL_INSERT_ATTEMPT_SQL"),
    markProcessing: extractSql(source, "EMAIL_MARK_PROCESSING_SQL"),
    finalizeAttempt: extractSql(source, "EMAIL_FINALIZE_ATTEMPT_SQL"),
    finalizeDelivery: extractSql(source, "EMAIL_FINALIZE_DELIVERY_SQL"),
    list: extractSql(source, "EMAIL_LIST_SQL"),
    findScoped: extractSql(source, "EMAIL_FIND_SCOPED_SQL"),
    attemptsScoped: extractSql(source, "EMAIL_ATTEMPTS_SCOPED_SQL")
  };
}

async function insertActiveAccount(database, suffix, role) {
  const accountId = `account_email_${suffix}`;
  const now = "2026-08-09T08:00:00.000Z";
  await database.query(
    `INSERT INTO auth_accounts (
       account_id, email_normalized, display_name, account_status,
       email_verified_at, created_at, updated_at
     ) VALUES ($1, $2, $3, 'active', $4, $4, $4)`,
    [accountId, `${suffix}@example.com`, `Email ${suffix}`, now]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id, role, created_at)
     VALUES ($1, $2, $3)`,
    [accountId, role, now]
  );
  return { accountId, now };
}

async function insertCompanyScope(database, accountId, suffix, now) {
  const tenantId = opaque("tenant", suffix);
  const membershipId = opaque("membership", suffix);
  await database.query(
    `INSERT INTO platform_tenants (
       tenant_id, tenant_type, display_name, tenant_status,
       created_by_account_id, created_at, updated_at, activated_at
     ) VALUES ($1, 'company', $2, 'active', $3, $4, $4, $4)`,
    [tenantId, `Email Tenant ${suffix}`, accountId, now]
  );
  await database.query(
    `INSERT INTO auth_tenant_memberships (
       membership_id, tenant_id, account_id, portal_role,
       membership_role, membership_status, created_by_account_id,
       created_at, updated_at, activated_at
     ) VALUES ($1, $2, $3, 'company', 'owner', 'active', $3, $4, $4, $4)`,
    [membershipId, tenantId, accountId, now]
  );
  return { tenantId, membershipId };
}

async function insertEmailJob(database, input) {
  const jobId = opaque("job", input.character);
  await database.query(
    `INSERT INTO platform_outbox_jobs (
       job_id, job_type, schema_version, idempotency_key, payload,
       enqueued_by_account_id, enqueued_by_role, tenant_id, membership_id
     ) VALUES ($1, 'email.delivery.foundation', 1, $2, $3::jsonb, $4, $5, $6, $7)`,
    [
      jobId,
      hash(input.character),
      JSON.stringify({ fixtureRef: `email.foundation.success.${input.character}` }),
      input.accountId,
      input.role,
      input.tenantId ?? null,
      input.membershipId ?? null
    ]
  );
  return jobId;
}

async function queueDelivery(database, sql, input) {
  return database.query(sql, [
    opaque("email_delivery", input.character),
    1,
    input.jobId,
    hash(input.deliveryKeyCharacter ?? input.character),
    input.accountId,
    input.role,
    input.tenantId ?? null,
    input.membershipId ?? null,
    hash(input.addressHashCharacter ?? "f")
  ]);
}

async function leaseJob(database, input) {
  const attemptId = opaque("attempt", input.character);
  const workerId = opaque("outbox_worker", input.workerCharacter ?? "W");
  const leaseId = opaque("lease", input.leaseCharacter ?? "L");
  await database.query(
    `UPDATE platform_outbox_jobs
     SET status = 'leased',
         attempt_count = $2,
         lease_id = $3,
         worker_id = $4,
         lease_expires_at = $5,
         updated_at = CURRENT_TIMESTAMP
     WHERE job_id = $1`,
    [
      input.jobId,
      input.attemptNumber,
      leaseId,
      workerId,
      input.expiresAt ?? "2099-01-01T00:00:00.000Z"
    ]
  );
  await database.query(
    `INSERT INTO platform_outbox_job_attempts (
       attempt_id, job_id, attempt_number, worker_id, lease_id, outcome
     ) VALUES ($1, $2, $3, $4, $5, 'running')`,
    [attemptId, input.jobId, input.attemptNumber, workerId, leaseId]
  );
  return { attemptId, workerId, leaseId };
}

async function expireOutboxAttempt(database, attemptId) {
  await database.query(
    `UPDATE platform_outbox_job_attempts
     SET outcome = 'lease_expired',
         error_code = 'lease_expired',
         error_summary = 'The outbox worker lease expired before completion.',
         finished_at = CURRENT_TIMESTAMP
     WHERE attempt_id = $1
       AND outcome = 'running'`,
    [attemptId]
  );
}

test("email delivery is queued durably and completes only under the exact active outbox lease", async () => {
  const sql = await contracts();
  const database = await openScriptDatabase(ENVIRONMENT);
  try {
    const manifest = (await listMigrations()).map((migration) => migration.id);
    const applied = await applyPendingMigrations(database, ENVIRONMENT.releaseSha);
    assert.deepEqual(applied, manifest);
    const emailIndex = manifest.indexOf("0010_email_delivery_foundation");
    assert.ok(emailIndex >= 0, "email delivery migration must remain registered");
    assert.equal(manifest[emailIndex - 1], "0009_persisted_notifications");

    const worker = await insertActiveAccount(database, "worker", "worker");
    const jobId = await insertEmailJob(database, {
      character: "A",
      accountId: worker.accountId,
      role: "worker"
    });
    const queued = await queueDelivery(database, sql.queue, {
      character: "A",
      jobId,
      accountId: worker.accountId,
      role: "worker"
    });
    assert.equal(queued.rows.length, 1);
    assert.equal(queued.rows[0].status, "queued");
    assert.equal(queued.rows[0].attempt_count, 0);
    assert.equal("recipient_address" in queued.rows[0], false);
    assert.match(queued.rows[0].recipient_address_hash, /^[a-f0-9]{64}$/);

    const lease = await leaseJob(database, {
      character: "B",
      jobId,
      attemptNumber: 1
    });
    const insertedAttempt = await database.query(sql.insertAttempt, [
      opaque("email_attempt", "B"),
      jobId,
      lease.attemptId,
      1,
      lease.workerId,
      lease.leaseId,
      "local_test",
      hash("d")
    ]);
    assert.equal(insertedAttempt.rows.length, 1);
    assert.equal(insertedAttempt.rows[0].outcome, "running");

    const processing = await database.query(sql.markProcessing, [
      queued.rows[0].delivery_id,
      1
    ]);
    assert.equal(processing.rows[0].status, "processing");
    assert.equal(processing.rows[0].attempt_count, 1);

    const finalizedAttempt = await database.query(sql.finalizeAttempt, [
      lease.attemptId,
      jobId,
      lease.workerId,
      lease.leaseId,
      "delivered",
      "local_accepted",
      "The local test adapter accepted the delivery.",
      hash("p")
    ]);
    assert.equal(finalizedAttempt.rows[0].outcome, "delivered");
    assert.ok(finalizedAttempt.rows[0].finished_at);

    const delivered = await database.query(sql.finalizeDelivery, [
      queued.rows[0].delivery_id,
      "delivered",
      1,
      "local_accepted",
      "The local test adapter accepted the delivery."
    ]);
    assert.equal(delivered.rows[0].status, "delivered");
    assert.ok(delivered.rows[0].delivered_at);
    assert.equal(delivered.rows[0].terminal_failed_at, null);

    const duplicateStart = await database.query(sql.insertAttempt, [
      opaque("email_attempt", "Q"),
      jobId,
      lease.attemptId,
      1,
      lease.workerId,
      lease.leaseId,
      "local_test",
      hash("d")
    ]);
    assert.equal(duplicateStart.rows.length, 0);

    const retained = await database.query(sql.findJob, [jobId]);
    assert.equal(retained.rows.length, 1);
    assert.equal(retained.rows[0].status, "delivered");
  } finally {
    await database.close();
  }
});

test("stale email leases are filtered and a reclaimed worker alone can continue delivery", async () => {
  const sql = await contracts();
  const database = await openScriptDatabase({
    ...ENVIRONMENT,
    releaseSha: "email-delivery-stale-lease-test"
  });
  try {
    await applyPendingMigrations(database, "email-delivery-stale-lease-test");
    const worker = await insertActiveAccount(database, "stale", "worker");
    const jobId = await insertEmailJob(database, {
      character: "C",
      accountId: worker.accountId,
      role: "worker"
    });
    const queued = await queueDelivery(database, sql.queue, {
      character: "C",
      jobId,
      accountId: worker.accountId,
      role: "worker"
    });
    const first = await leaseJob(database, {
      character: "D",
      jobId,
      attemptNumber: 1,
      workerCharacter: "W",
      leaseCharacter: "L",
      expiresAt: "2000-01-01T00:00:00.000Z"
    });
    const firstAttempt = await database.query(sql.insertAttempt, [
      opaque("email_attempt", "D"),
      jobId,
      first.attemptId,
      1,
      first.workerId,
      first.leaseId,
      "local_test",
      hash("e")
    ]);
    assert.equal(firstAttempt.rows.length, 0);

    await expireOutboxAttempt(database, first.attemptId);
    await database.query(
      `UPDATE platform_outbox_jobs
       SET status = 'retry_wait', lease_id = NULL, worker_id = NULL,
           lease_expires_at = NULL, next_attempt_at = CURRENT_TIMESTAMP - INTERVAL '1 second',
           updated_at = CURRENT_TIMESTAMP
       WHERE job_id = $1`,
      [jobId]
    );
    const second = await leaseJob(database, {
      character: "E",
      jobId,
      attemptNumber: 2,
      workerCharacter: "X",
      leaseCharacter: "M"
    });
    const secondAttempt = await database.query(sql.insertAttempt, [
      opaque("email_attempt", "E"),
      jobId,
      second.attemptId,
      2,
      second.workerId,
      second.leaseId,
      "local_test",
      hash("f")
    ]);
    assert.equal(secondAttempt.rows.length, 1);
    const processing = await database.query(sql.markProcessing, [
      queued.rows[0].delivery_id,
      2
    ]);
    assert.equal(processing.rows[0].attempt_count, 2);
  } finally {
    await database.close();
  }
});

test("email delivery reads are direct recipient and Company tenant boundaries", async () => {
  const sql = await contracts();
  const database = await openScriptDatabase({
    ...ENVIRONMENT,
    releaseSha: "email-delivery-isolation-test"
  });
  try {
    await applyPendingMigrations(database, "email-delivery-isolation-test");
    const first = await insertActiveAccount(database, "company-a", "company");
    const second = await insertActiveAccount(database, "company-b", "company");
    const firstScope = await insertCompanyScope(database, first.accountId, "A", first.now);
    const secondScope = await insertCompanyScope(database, second.accountId, "B", second.now);
    const firstJob = await insertEmailJob(database, {
      character: "F",
      accountId: first.accountId,
      role: "company",
      ...firstScope
    });
    const secondJob = await insertEmailJob(database, {
      character: "G",
      accountId: second.accountId,
      role: "company",
      ...secondScope
    });
    const firstDelivery = await queueDelivery(database, sql.queue, {
      character: "F",
      jobId: firstJob,
      accountId: first.accountId,
      role: "company",
      ...firstScope
    });
    const secondDelivery = await queueDelivery(database, sql.queue, {
      character: "G",
      jobId: secondJob,
      accountId: second.accountId,
      role: "company",
      ...secondScope
    });
    assert.equal(firstDelivery.rows.length, 1);
    assert.equal(secondDelivery.rows.length, 1);

    const firstList = await database.query(sql.list, [
      first.accountId,
      "company",
      firstScope.tenantId,
      firstScope.membershipId,
      null,
      50
    ]);
    assert.deepEqual(
      firstList.rows.map((row) => row.delivery_id),
      [firstDelivery.rows[0].delivery_id]
    );
    const copied = await database.query(sql.findScoped, [
      secondDelivery.rows[0].delivery_id,
      first.accountId,
      "company",
      firstScope.tenantId,
      firstScope.membershipId
    ]);
    assert.equal(copied.rows.length, 0);
  } finally {
    await database.close();
  }
});

test("email delivery queue rejects a source scope mismatch and an unverified recipient", async () => {
  const sql = await contracts();
  const database = await openScriptDatabase({
    ...ENVIRONMENT,
    releaseSha: "email-delivery-scope-validation-test"
  });
  try {
    await applyPendingMigrations(database, "email-delivery-scope-validation-test");
    const first = await insertActiveAccount(database, "scope-a", "company");
    const second = await insertActiveAccount(database, "scope-b", "company");
    const firstScope = await insertCompanyScope(database, first.accountId, "C", first.now);
    const secondScope = await insertCompanyScope(database, second.accountId, "D", second.now);
    const jobId = await insertEmailJob(database, {
      character: "H",
      accountId: first.accountId,
      role: "company",
      ...firstScope
    });
    const mismatched = await queueDelivery(database, sql.queue, {
      character: "H",
      jobId,
      accountId: second.accountId,
      role: "company",
      ...secondScope
    });
    assert.equal(mismatched.rows.length, 0);

    const pendingId = "account_email_pending";
    await database.query(
      `INSERT INTO auth_accounts (
         account_id, email_normalized, display_name, account_status,
         created_at, updated_at
       ) VALUES ($1, 'pending@example.com', 'Pending Email', 'pending_email',
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [pendingId]
    );
    await database.query(
      `INSERT INTO auth_account_roles (account_id, role)
       VALUES ($1, 'worker')`,
      [pendingId]
    );
    const pendingJob = await insertEmailJob(database, {
      character: "I",
      accountId: pendingId,
      role: "worker"
    });
    const unverified = await queueDelivery(database, sql.queue, {
      character: "I",
      jobId: pendingJob,
      accountId: pendingId,
      role: "worker"
    });
    assert.equal(unverified.rows.length, 0);
  } finally {
    await database.close();
  }
});
