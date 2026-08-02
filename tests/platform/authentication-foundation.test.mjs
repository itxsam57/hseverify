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
  releaseSha: "authentication-foundation-test",
  sessionSecret:
    "authentication-foundation-session-secret-with-at-least-thirty-two-characters",
  authPepper:
    "authentication-foundation-session-secret-with-at-least-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function openMigratedDatabase() {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
  return database;
}

test("authentication migration creates the complete security-state boundary", async () => {
  const database = await openMigratedDatabase();
  try {
    const tables = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
       ORDER BY table_name`
    );
    const names = new Set(tables.rows.map((row) => row.table_name));
    for (const table of [
      "auth_accounts",
      "auth_account_roles",
      "auth_otp_challenges",
      "auth_sessions",
      "auth_staff_invitations",
      "auth_mfa_factors",
      "auth_security_events"
    ]) {
      assert.equal(names.has(table), true, `Missing authentication table ${table}`);
    }

    const status = await migrationStatus(database);
    assert.deepEqual(
      status.map((entry) => [entry.id, entry.applied, entry.checksumMatches]),
      [
        ["0001_platform_foundation", true, true],
        ["0002_authentication_foundation", true, true],
        ["0003_worker_registration_otp", true, true]
      ]
    );
  } finally {
    await database.close();
  }
});

test("authentication roles, sessions and lifecycle constraints reject invalid state", async () => {
  const database = await openMigratedDatabase();
  try {
    const now = new Date("2026-08-02T12:00:00.000Z").toISOString();
    const expiresAt = new Date("2026-08-03T12:00:00.000Z").toISOString();
    await database.query(
      `INSERT INTO auth_accounts (
         account_id, email_normalized, phone_e164, display_name,
         account_status, password_hash, worker_reference,
         email_verified_at, phone_verified_at, password_set_at,
         created_at, updated_at
       ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $7, $7, $7, $7)`,
      [
        "acct_worker_test",
        "worker@example.com",
        "+923001234567",
        "Worker Test",
        "scrypt$16384$8$1$salt$hash",
        "HSE-REG-TEST00000001",
        now
      ]
    );
    await database.query(
      `INSERT INTO auth_account_roles (account_id, role, created_at)
       VALUES ($1, 'worker', $2)`,
      ["acct_worker_test", now]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_account_roles (account_id, role, created_at)
         VALUES ($1, 'reviewer', $2)`,
        ["acct_worker_test", now]
      ),
      /auth_account_roles|check constraint|violates/i
    );
    await assert.rejects(
      database.query(
        `UPDATE auth_accounts
         SET account_status = 'verified'
         WHERE account_id = $1`,
        ["acct_worker_test"]
      ),
      /auth_accounts|check constraint|violates/i
    );
    await assert.rejects(
      database.query(
        `INSERT INTO auth_sessions (
           session_id, account_id, active_role, token_hash, csrf_token_hash,
           created_at, last_seen_at, expires_at
         ) VALUES ($1, $2, 'admin', $3, $4, $5, $5, $6)`,
        [
          "session_unassigned_admin",
          "acct_worker_test",
          "token-hash-unassigned-admin",
          "csrf-hash-unassigned-admin",
          now,
          expiresAt
        ]
      ),
      /auth_sessions_assigned_role_fk|foreign key|violates/i
    );

    const validSession = await database.query(
      `INSERT INTO auth_sessions (
         session_id, account_id, active_role, token_hash, csrf_token_hash,
         created_at, last_seen_at, expires_at
       ) VALUES ($1, $2, 'worker', $3, $4, $5, $5, $6)
       RETURNING active_role`,
      [
        "session_assigned_worker",
        "acct_worker_test",
        "token-hash-assigned-worker",
        "csrf-hash-assigned-worker",
        now,
        expiresAt
      ]
    );
    assert.equal(validSession.rows[0]?.active_role, "worker");

    await database.query(
      `INSERT INTO auth_accounts (
         account_id, email_normalized, phone_e164, display_name,
         account_status, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, 'pending_email', $5, $5)`,
      [
        "acct_unverified_test",
        "unverified@example.com",
        "+923009876543",
        "Unverified Test",
        now
      ]
    );
    await assert.rejects(
      database.query(
        `UPDATE auth_accounts
         SET account_status = 'active'
         WHERE account_id = $1`,
        ["acct_unverified_test"]
      ),
      /auth_accounts_verified_access_state_check|check constraint|violates/i
    );
    await assert.rejects(
      database.query(
        `UPDATE auth_accounts
         SET account_status = 'locked', locked_until = $2
         WHERE account_id = $1`,
        ["acct_unverified_test", expiresAt]
      ),
      /auth_accounts_verified_access_state_check|check constraint|violates/i
    );
  } finally {
    await database.close();
  }
});

test("OTP challenge consumption is atomic and cannot be replayed", async () => {
  const database = await openMigratedDatabase();
  try {
    const now = new Date("2026-08-02T12:00:00.000Z");
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();
    const resendAt = new Date(now.getTime() + 60 * 1000).toISOString();
    await database.query(
      `INSERT INTO auth_accounts (
         account_id, email_normalized, display_name, account_status,
         created_at, updated_at
       ) VALUES ($1, $2, $3, 'pending_email', $4, $4)`,
      ["acct_otp_test", "otp@example.com", "OTP Test", now.toISOString()]
    );
    await database.query(
      `INSERT INTO auth_otp_challenges (
         challenge_id, account_id, purpose, channel, destination_hash,
         delivery_hint, code_hash, attempts_remaining,
         resend_available_at, expires_at, created_at
       ) VALUES ($1, $2, 'registration_email', 'email', $3, $4, $5, 5, $6, $7, $8)`,
      [
        "otp_challenge_test",
        "acct_otp_test",
        "destination-hash",
        "o**@example.com",
        "code-hash",
        resendAt,
        expiresAt,
        now.toISOString()
      ]
    );

    await assert.rejects(
      database.query(
        `INSERT INTO auth_otp_challenges (
           challenge_id, account_id, purpose, channel, destination_hash,
           delivery_hint, code_hash, attempts_remaining,
           resend_available_at, expires_at, created_at
         ) VALUES ($1, $2, 'registration_email', 'email', $3, $4, $5, 5, $6, $7, $8)`,
        [
          "otp_invalid_window",
          "acct_otp_test",
          "destination-hash-invalid",
          "o**@example.com",
          "code-hash-invalid",
          new Date(now.getTime() + 11 * 60 * 1000).toISOString(),
          expiresAt,
          now.toISOString()
        ]
      ),
      /auth_otp_resend_window_check|check constraint|violates/i
    );

    const first = await database.query(
      `UPDATE auth_otp_challenges
       SET consumed_at = $2
       WHERE challenge_id = $1
         AND consumed_at IS NULL
         AND invalidated_at IS NULL
         AND expires_at > $2
         AND attempts_remaining > 0
       RETURNING challenge_id`,
      ["otp_challenge_test", now.toISOString()]
    );
    assert.equal(first.rows.length, 1);

    const replay = await database.query(
      `UPDATE auth_otp_challenges
       SET consumed_at = $2
       WHERE challenge_id = $1
         AND consumed_at IS NULL
         AND invalidated_at IS NULL
         AND expires_at > $2
         AND attempts_remaining > 0
       RETURNING challenge_id`,
      [
        "otp_challenge_test",
        new Date(now.getTime() + 1000).toISOString()
      ]
    );
    assert.equal(replay.rows.length, 0);
  } finally {
    await database.close();
  }
});

test("registration writes roll back as one unit", async () => {
  const database = await openMigratedDatabase();
  try {
    await assert.rejects(
      database.transaction(async (transaction) => {
        const now = new Date().toISOString();
        await transaction.query(
          `INSERT INTO auth_accounts (
             account_id, email_normalized, display_name, account_status,
             created_at, updated_at
           ) VALUES ($1, $2, $3, 'pending_email', $4, $4)`,
          ["acct_rollback_test", "rollback@example.com", "Rollback Test", now]
        );
        await transaction.query(
          `INSERT INTO auth_account_roles (account_id, role, created_at)
           VALUES ($1, 'worker', $2)`,
          ["acct_rollback_test", now]
        );
        throw new Error("force rollback");
      }),
      /force rollback/
    );

    const account = await database.query(
      `SELECT account_id FROM auth_accounts WHERE account_id = $1`,
      ["acct_rollback_test"]
    );
    const role = await database.query(
      `SELECT account_id FROM auth_account_roles WHERE account_id = $1`,
      ["acct_rollback_test"]
    );
    assert.equal(account.rows.length, 0);
    assert.equal(role.rows.length, 0);
  } finally {
    await database.close();
  }
});

test("authentication repository keeps lifecycle and session operations constrained", async () => {
  const repository = await readFile(
    resolve("src/lib/auth/auth-repository.ts"),
    "utf8"
  );
  const database = await readFile(
    resolve("src/lib/database/database.ts"),
    "utf8"
  );

  assert.match(
    repository,
    /VALUES \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$9\)/
  );
  assert.doesNotMatch(repository, /VALUES \([^)]*'[^']*\$\{/);
  assert.match(repository, /FOR UPDATE/);
  assert.match(repository, /consumed_at IS NULL/);
  assert.match(repository, /sessions\.revoked_at IS NULL/);
  assert.match(repository, /accounts\.account_status = 'active'/);
  assert.match(repository, /AND account_status = 'active'\s+RETURNING/);
  assert.match(repository, /Only an active account can record a sign-in failure/);
  assert.match(database, /transaction<T>/);
  assert.match(database, /type PostgresExecutor = Pick<PostgresSql, "unsafe">/);
  assert.doesNotMatch(database, /Parameters<PostgresSql\["begin"\]>/);
  assert.match(database, /this\.owner\.transaction/);
  assert.match(database, /this\.sql\.begin/);
});

test("authentication migration remains independently reversible beneath registration", async () => {
  const database = await openMigratedDatabase();
  const previous = process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
  process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = "true";
  try {
    const registrationRollback = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(registrationRollback, "0003_worker_registration_otp");

    const authStillPresent = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_accounts'`
    );
    const registrationRemoved = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_registration_flows'`
    );
    assert.equal(authStillPresent.rows.length, 1);
    assert.equal(registrationRemoved.rows.length, 0);

    const authenticationRollback = await rollbackLatestMigration(
      database,
      TEST_ENVIRONMENT
    );
    assert.equal(authenticationRollback, "0002_authentication_foundation");

    const platformTable = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'worker_profiles'`
    );
    const authTable = await database.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'auth_accounts'`
    );
    assert.equal(platformTable.rows.length, 1);
    assert.equal(authTable.rows.length, 0);

    const reapplied = await applyPendingMigrations(
      database,
      TEST_ENVIRONMENT.releaseSha
    );
    assert.deepEqual(reapplied, [
      "0002_authentication_foundation",
      "0003_worker_registration_otp"
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
