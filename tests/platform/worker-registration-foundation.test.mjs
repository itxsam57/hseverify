import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import {
  applyPendingMigrations,
  migrationStatus,
  rollbackLatestMigration
} from "../../scripts/lib/migrations.mjs";

const TEST_ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "worker-registration-foundation-test",
  sessionSecret:
    "worker-registration-session-secret-with-at-least-thirty-two-characters",
  authPepper:
    "worker-registration-auth-pepper-with-at-least-thirty-two-characters",
  authSandboxEnabled: true,
  authSandboxAccessKey: "worker-registration-sandbox-key",
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function openMigratedDatabase() {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
  return database;
}

async function insertPendingWorker(database, suffix = "base") {
  const now = new Date("2026-08-02T18:00:00.000Z").toISOString();
  const accountId = `acct_registration_${suffix}`;
  await database.query(
    `INSERT INTO auth_accounts (
       account_id, email_normalized, phone_e164, display_name,
       account_status, password_hash, worker_reference, password_set_at,
       created_at, updated_at
     ) VALUES ($1, $2, $3, $4, 'pending_email', $5, $6, $7, $7, $7)`,
    [
      accountId,
      `${suffix}@example.com`,
      `+92300${String(1000000 + suffix.length).slice(-7)}`,
      `Registration ${suffix}`,
      "scrypt$16384$8$1$not-plaintext$not-plaintext",
      `HSE-REG-${suffix.toUpperCase().padEnd(12, "0").slice(0, 12)}`,
      now
    ]
  );
  await database.query(
    `INSERT INTO auth_account_roles (account_id, role, created_at)
     VALUES ($1, 'worker', $2)`,
    [accountId, now]
  );
  return { accountId, now };
}

test("registration migration creates continuation and encrypted delivery boundaries", async () => {
  const database = await openMigratedDatabase();
  try {
    const tables = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN (
           'auth_registration_flows',
           'auth_sandbox_deliveries',
           'auth_rate_limit_buckets'
         )
       ORDER BY table_name`
    );
    assert.deepEqual(
      tables.rows.map((row) => row.table_name),
      [
        "auth_rate_limit_buckets",
        "auth_registration_flows",
        "auth_sandbox_deliveries"
      ]
    );

    const status = await migrationStatus(database);
    assert.deepEqual(
      status.map((entry) => [entry.id, entry.applied, entry.checksumMatches]),
      [
        ["0001_platform_foundation", true, true],
        ["0002_authentication_foundation", true, true],
        ["0003_worker_registration_otp", true, true],
        ["0004_authentication_completion", true, true],
        ["0005_authorization_tenant_isolation", true, true],
        ["0006_authorization_tenant_scope_fixture", true, true]
      ]
    );
  } finally {
    await database.close();
  }
});

test("one pending Worker has only one active continuation flow", async () => {
  const database = await openMigratedDatabase();
  try {
    const { accountId, now } = await insertPendingWorker(database, "unique");
    const expiresAt = new Date(
      new Date(now).getTime() + 60 * 60 * 1000
    ).toISOString();
    await database.query(
      `INSERT INTO auth_registration_flows (
         flow_id, account_id, token_hash, current_step, expires_at,
         created_at, updated_at
       ) VALUES ($1, $2, $3, 'pending_email', $4, $5, $5)`,
      ["flow_unique_one", accountId, "token-hash-one", expiresAt, now]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_registration_flows (
           flow_id, account_id, token_hash, current_step, expires_at,
           created_at, updated_at
         ) VALUES ($1, $2, $3, 'pending_phone', $4, $5, $5)`,
        ["flow_unique_two", accountId, "token-hash-two", expiresAt, now]
      ),
      /auth_active_registration_account_idx|unique|duplicate/i
    );
    await assert.rejects(
      database.query(
        `UPDATE auth_registration_flows
         SET current_step = 'complete'
         WHERE flow_id = $1`,
        ["flow_unique_one"]
      ),
      /auth_registration_flow_completion_check|check constraint|violates/i
    );
    await assert.rejects(
      database.query(
        `INSERT INTO auth_registration_flows (
           flow_id, account_id, token_hash, current_step, expires_at,
           created_at, updated_at
         ) VALUES ($1, $2, $3, 'cancelled', $4, $5, $5)`,
        [
          "flow_invalid_expiry",
          accountId,
          "token-hash-invalid-expiry",
          new Date(new Date(now).getTime() - 1000).toISOString(),
          now
        ]
      ),
      /auth_registration_flow_expiry_check|check constraint|violates/i
    );
  } finally {
    await database.close();
  }
});

test("sandbox delivery stores no plaintext code and activation requires both contacts", async () => {
  const database = await openMigratedDatabase();
  try {
    const { accountId, now } = await insertPendingWorker(database, "lifecycle");
    const resendAt = new Date(new Date(now).getTime() + 60_000).toISOString();
    const expiresAt = new Date(new Date(now).getTime() + 600_000).toISOString();
    const flowExpiresAt = new Date(
      new Date(now).getTime() + 3_600_000
    ).toISOString();
    const plaintextCode = "123456";

    await database.query(
      `INSERT INTO auth_registration_flows (
         flow_id, account_id, token_hash, current_step, expires_at,
         created_at, updated_at
       ) VALUES ($1, $2, $3, 'pending_email', $4, $5, $5)`,
      ["flow_lifecycle", accountId, "flow-token-hash", flowExpiresAt, now]
    );
    await database.query(
      `INSERT INTO auth_otp_challenges (
         challenge_id, account_id, purpose, channel, destination_hash,
         delivery_hint, code_hash, attempts_remaining,
         resend_available_at, expires_at, created_at
       ) VALUES ($1, $2, 'registration_email', 'email', $3, $4, $5, 5, $6, $7, $8)`,
      [
        "otp_lifecycle",
        accountId,
        "destination-hash",
        "l*******@example.com",
        "hmac-code-hash-without-plaintext",
        resendAt,
        expiresAt,
        now
      ]
    );
    await database.query(
      `INSERT INTO auth_sandbox_deliveries (
         delivery_id, challenge_id, channel, destination_hash,
         delivery_hint, encrypted_code, created_at
       ) VALUES ($1, $2, 'email', $3, $4, $5, $6)`,
      [
        "delivery_lifecycle",
        "otp_lifecycle",
        "destination-hash",
        "l*******@example.com",
        "v1.encrypted.authenticated.ciphertext",
        now
      ]
    );

    const stored = await database.query(
      `SELECT challenges.code_hash, deliveries.encrypted_code
       FROM auth_otp_challenges AS challenges
       INNER JOIN auth_sandbox_deliveries AS deliveries
         ON deliveries.challenge_id = challenges.challenge_id
       WHERE challenges.challenge_id = $1`,
      ["otp_lifecycle"]
    );
    assert.equal(stored.rows.length, 1);
    assert.equal(stored.rows[0].code_hash.includes(plaintextCode), false);
    assert.equal(stored.rows[0].encrypted_code.includes(plaintextCode), false);

    await database.query(
      `UPDATE auth_accounts
       SET email_verified_at = $2,
           account_status = 'pending_phone',
           updated_at = $2
       WHERE account_id = $1`,
      [accountId, now]
    );
    await database.query(
      `UPDATE auth_registration_flows
       SET current_step = 'pending_phone', updated_at = $2
       WHERE flow_id = $1`,
      ["flow_lifecycle", now]
    );
    await assert.rejects(
      database.query(
        `UPDATE auth_accounts
         SET account_status = 'active'
         WHERE account_id = $1`,
        [accountId]
      ),
      /auth_accounts_verified_access_state_check|check constraint|violates/i
    );

    await database.query(
      `UPDATE auth_accounts
       SET phone_verified_at = $2,
           account_status = 'active',
           updated_at = $2
       WHERE account_id = $1`,
      [accountId, now]
    );
    await database.query(
      `UPDATE auth_registration_flows
       SET current_step = 'complete', completed_at = $2, updated_at = $2
       WHERE flow_id = $1`,
      ["flow_lifecycle", now]
    );

    const finalState = await database.query(
      `SELECT accounts.account_status, flows.current_step, flows.completed_at
       FROM auth_accounts AS accounts
       INNER JOIN auth_registration_flows AS flows
         ON flows.account_id = accounts.account_id
       WHERE accounts.account_id = $1`,
      [accountId]
    );
    assert.equal(finalState.rows[0].account_status, "active");
    assert.equal(finalState.rows[0].current_step, "complete");
    assert.equal(new Date(finalState.rows[0].completed_at).toISOString(), now);
  } finally {
    await database.close();
  }
});

test("cancelling an unactivated registration cascades sensitive state but preserves the security event", async () => {
  const database = await openMigratedDatabase();
  try {
    const { accountId, now } = await insertPendingWorker(database, "cancel");
    const expiresAt = new Date(new Date(now).getTime() + 600_000).toISOString();
    const flowExpiresAt = new Date(
      new Date(now).getTime() + 3_600_000
    ).toISOString();

    await database.query(
      `INSERT INTO auth_registration_flows (
         flow_id, account_id, token_hash, current_step, expires_at,
         created_at, updated_at
       ) VALUES ($1, $2, $3, 'pending_email', $4, $5, $5)`,
      ["flow_cancel", accountId, "flow-cancel-token-hash", flowExpiresAt, now]
    );
    await database.query(
      `INSERT INTO auth_otp_challenges (
         challenge_id, account_id, purpose, channel, destination_hash,
         delivery_hint, code_hash, attempts_remaining,
         resend_available_at, expires_at, created_at
       ) VALUES ($1, $2, 'registration_email', 'email', $3, $4, $5, 5, $6, $7, $8)`,
      [
        "otp_cancel",
        accountId,
        "cancel-destination-hash",
        "c****l@example.com",
        "cancel-code-hash",
        new Date(new Date(now).getTime() + 60_000).toISOString(),
        expiresAt,
        now
      ]
    );
    await database.query(
      `INSERT INTO auth_sandbox_deliveries (
         delivery_id, challenge_id, channel, destination_hash,
         delivery_hint, encrypted_code, created_at
       ) VALUES ($1, $2, 'email', $3, $4, $5, $6)`,
      [
        "delivery_cancel",
        "otp_cancel",
        "cancel-destination-hash",
        "c****l@example.com",
        "v1.cancel.encrypted.code",
        now
      ]
    );
    await database.query(
      `INSERT INTO auth_security_events (
         event_id, account_id, event_type, active_role, metadata, occurred_at
       ) VALUES ($1, $2, 'access_denied', 'worker', $3::jsonb, $4)`,
      [
        "event_cancel",
        accountId,
        JSON.stringify({ area: "worker_registration", reason: "user_cancelled" }),
        now
      ]
    );

    const deleted = await database.query(
      `DELETE FROM auth_accounts AS accounts
       WHERE accounts.account_id = $1
         AND accounts.account_status IN ('pending_email', 'pending_phone')
         AND NOT EXISTS (
           SELECT 1 FROM auth_sessions AS sessions
           WHERE sessions.account_id = accounts.account_id
         )`,
      [accountId]
    );
    assert.equal(deleted.affectedRows, 1);

    for (const [table, column, value] of [
      ["auth_accounts", "account_id", accountId],
      ["auth_account_roles", "account_id", accountId],
      ["auth_registration_flows", "account_id", accountId],
      ["auth_otp_challenges", "account_id", accountId],
      ["auth_sandbox_deliveries", "delivery_id", "delivery_cancel"]
    ]) {
      const result = await database.query(
        `SELECT 1 FROM ${table} WHERE ${column} = $1`,
        [value]
      );
      assert.equal(result.rows.length, 0, `${table} was not removed`);
    }

    const event = await database.query(
      `SELECT account_id, metadata
       FROM auth_security_events
       WHERE event_id = $1`,
      ["event_cancel"]
    );
    assert.equal(event.rows.length, 1);
    assert.equal(event.rows[0].account_id, null);
    assert.equal(event.rows[0].metadata.reason, "user_cancelled");
  } finally {
    await database.close();
  }
});

test("an active account cannot be removed by the registration cancellation boundary", async () => {
  const database = await openMigratedDatabase();
  try {
    const { accountId, now } = await insertPendingWorker(database, "activeguard");
    await database.query(
      `UPDATE auth_accounts
       SET email_verified_at = $2,
           phone_verified_at = $2,
           account_status = 'active',
           updated_at = $2
       WHERE account_id = $1`,
      [accountId, now]
    );

    const deleted = await database.query(
      `DELETE FROM auth_accounts AS accounts
       WHERE accounts.account_id = $1
         AND accounts.account_status IN ('pending_email', 'pending_phone')
         AND NOT EXISTS (
           SELECT 1 FROM auth_sessions AS sessions
           WHERE sessions.account_id = accounts.account_id
         )`,
      [accountId]
    );
    assert.equal(deleted.affectedRows, 0);

    const account = await database.query(
      `SELECT account_status FROM auth_accounts WHERE account_id = $1`,
      [accountId]
    );
    assert.equal(account.rows[0].account_status, "active");
  } finally {
    await database.close();
  }
});

test("registration migration remains independently reversible beneath later layers", async () => {
  const database = await openMigratedDatabase();
  const previous = process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
  process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = "true";
  try {
    const tenantScopeRollback = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(tenantScopeRollback, "0006_authorization_tenant_scope_fixture");

    const registrationAfterTenantScopeRollback = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_registration_flows'`
    );
    const tenantStillPresent = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'platform_tenants'`
    );
    const fixtureRemoved = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'authorization_tenant_scope_fixtures'`
    );
    assert.equal(registrationAfterTenantScopeRollback.rows.length, 1);
    assert.equal(tenantStillPresent.rows.length, 1);
    assert.equal(fixtureRemoved.rows.length, 0);

    const authorizationRollback = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(authorizationRollback, "0005_authorization_tenant_isolation");

    const registrationAfterAuthorizationRollback = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_registration_flows'`
    );
    const tenantRemoved = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'platform_tenants'`
    );
    assert.equal(registrationAfterAuthorizationRollback.rows.length, 1);
    assert.equal(tenantRemoved.rows.length, 0);

    const completionRollback = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(completionRollback, "0004_authentication_completion");

    const registrationStillPresent = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_registration_flows'`
    );
    const completionRemoved = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_recovery_flows'`
    );
    assert.equal(registrationStillPresent.rows.length, 1);
    assert.equal(completionRemoved.rows.length, 0);

    const registrationRollback = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(registrationRollback, "0003_worker_registration_otp");

    const authentication = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_accounts'`
    );
    const registration = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_registration_flows'`
    );
    assert.equal(authentication.rows.length, 1);
    assert.equal(registration.rows.length, 0);

    const reapplied = await applyPendingMigrations(
      database,
      TEST_ENVIRONMENT.releaseSha
    );
    assert.deepEqual(reapplied, [
      "0003_worker_registration_otp",
      "0004_authentication_completion",
      "0005_authorization_tenant_isolation",
      "0006_authorization_tenant_scope_fixture"
    ]);
  } finally {
    if (previous === undefined) {
      delete process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
    } else {
      process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = previous;
    }
    await database.close();
  }
});

test("registration source keeps continuation, OTP, recovery and sandbox boundaries explicit", async () => {
  const service = await readFile(
    resolve("src/lib/auth/worker-registration-service.ts"),
    "utf8"
  );
  const repository = await readFile(
    resolve("src/lib/auth/worker-registration-repository.ts"),
    "utf8"
  );
  const cookie = await readFile(
    resolve("src/lib/auth/worker-registration-cookie.ts"),
    "utf8"
  );
  const environment = await readFile(
    resolve("src/lib/config/environment.ts"),
    "utf8"
  );

  for (const marker of [
    "validatePassword",
    "hashPassword",
    "hashOtpCode",
    "verifyOtpCode",
    "encryptSecret",
    "insertSandboxDelivery",
    "consumeOtpChallenge",
    "updateAccountAfterEmailVerification",
    "updateAccountAfterPhoneVerification",
    "registration_started",
    "otp_issued",
    "otp_failed",
    "otp_verified",
    "deleteUnactivatedAccount",
    'reason: "user_cancelled"'
  ]) {
    assert.match(service, new RegExp(marker));
  }
  assert.doesNotMatch(service, /createWorkerSession|console\.|cancelFlow/);
  assert.ok(
    service.indexOf("consumeOtpChallenge") <
      service.indexOf("updateAccountAfterEmailVerification")
  );
  assert.ok(
    service.indexOf("await this.enforceStartRateLimit") <
      service.indexOf("const passwordHash = await hashPassword")
  );
  assert.match(service, /if \(pendingWorker\.status === "pending_email"\)/);
  assert.match(service, /else \{\s+account = pendingWorker;/);
  assert.match(service, /workerReference: null/);

  assert.match(repository, /type DatabaseTimestamp = string \| Date/);
  assert.match(repository, /value instanceof Date \? value\.toISOString\(\) : value/);
  assert.match(repository, /FOR UPDATE/);
  assert.match(repository, /current_step IN \('pending_email', 'pending_phone'\)/);
  assert.match(repository, /AND account_status = 'pending_email'/);
  assert.match(repository, /deleteUnactivatedAccount/);
  assert.match(repository, /accounts\.account_status IN \('pending_email', 'pending_phone'\)/);
  assert.match(repository, /NOT EXISTS \(/);
  assert.match(repository, /FROM auth_sessions AS sessions/);
  assert.match(repository, /consumeRegistrationStartRateLimit/);
  assert.match(repository, /challenges\.consumed_at IS NULL/);
  assert.match(repository, /challenges\.invalidated_at IS NULL/);
  assert.match(repository, /challenges\.expires_at > CURRENT_TIMESTAMP/);
  assert.match(repository, /auth_sandbox_deliveries/);

  assert.match(cookie, /httpOnly: true/);
  assert.match(cookie, /path: "\/worker\/register"/);
  assert.match(environment, /HSE_ENABLE_AUTH_SANDBOX/);
  assert.match(environment, /restricted to development and test environments/);
});
