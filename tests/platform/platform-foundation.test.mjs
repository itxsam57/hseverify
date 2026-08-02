import assert from "node:assert/strict";
import { win32 } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { validateScriptEnvironment } from "../../scripts/lib/environment.mjs";
import {
  applyPendingMigrations,
  migrationStatus,
  rollbackLatestMigration
} from "../../scripts/lib/migrations.mjs";
import { normalizePgliteDataDirectory } from "../../src/lib/database/pglite-path.mjs";

const TEST_ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "platform-test-release",
  sessionSecret: "platform-test-session-secret-with-at-least-thirty-two-characters",
  demoAuthEnabled: false,
  demoDataEnabled: false
};

test("environment validation separates local and production rules", () => {
  const local = validateScriptEnvironment({
    NODE_ENV: "test",
    HSE_APP_ENV: "test",
    HSE_DATABASE_DRIVER: "pglite",
    HSE_PGLITE_DATA_DIR: "memory://",
    HSE_SESSION_SECRET: TEST_ENVIRONMENT.sessionSecret
  });
  assert.equal(local.databaseDriver, "pglite");

  assert.throws(
    () =>
      validateScriptEnvironment({
        NODE_ENV: "production",
        HSE_APP_ENV: "production",
        HSE_DATABASE_DRIVER: "pglite",
        HSE_SESSION_SECRET: TEST_ENVIRONMENT.sessionSecret,
        HSE_ENABLE_WORKER_DEMO_AUTH: "true"
      }),
    /PGlite is restricted|demo/i
  );
});

test("PGlite path normalization returns a native Windows string", () => {
  const normalized = normalizePgliteDataDirectory(
    ".data\\postgres-owner-test",
    {
      cwd: "C:\\work\\hseverify",
      pathApi: win32
    }
  );

  assert.equal(
    normalized,
    "C:\\work\\hseverify\\.data\\postgres-owner-test"
  );
  assert.equal(typeof normalized, "string");
  assert.equal(normalizePgliteDataDirectory("memory://"), "memory://");
  assert.throws(
    () => normalizePgliteDataDirectory(new URL("file:///C:/work/hseverify/.data/postgres")),
    /must be a string/
  );
});

test("migrations are deterministic and idempotent", async () => {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  try {
    const first = await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
    assert.deepEqual(first, ["0001_platform_foundation"]);
    const second = await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
    assert.deepEqual(second, []);
    const status = await migrationStatus(database);
    assert.equal(status.length, 1);
    assert.equal(status[0].applied, true);
    assert.equal(status[0].checksumMatches, true);
  } finally {
    await database.close();
  }
});

test("worker profile writes reject stale versions at the SQL boundary", async () => {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  try {
    await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
    const document = JSON.stringify({
      schemaVersion: 1,
      workerSub: "worker-test-sub",
      workerId: "HSE-WRK-TEST-DB",
      version: 1,
      status: "draft",
      personal: {},
      contact: {},
      professional: {},
      audit: []
    });
    const inserted = await database.query(
      `INSERT INTO worker_profiles (
         worker_sub, worker_id, schema_version, version, status,
         profile_document, created_at, updated_at, submitted_at
       ) VALUES ($1, $2, 1, 1, 'draft', $3::jsonb, $4, $4, NULL)
       RETURNING version`,
      ["worker-test-sub", "HSE-WRK-TEST-DB", document, new Date().toISOString()]
    );
    assert.equal(inserted.rows.length, 1);

    const updated = await database.query(
      `UPDATE worker_profiles
       SET version = 2
       WHERE worker_sub = $1 AND version = 1
       RETURNING version`,
      ["worker-test-sub"]
    );
    assert.equal(updated.rows[0].version, 2);

    const stale = await database.query(
      `UPDATE worker_profiles
       SET version = 3
       WHERE worker_sub = $1 AND version = 1
       RETURNING version`,
      ["worker-test-sub"]
    );
    assert.equal(stale.rows.length, 0);
  } finally {
    await database.close();
  }
});

test("local rollback is explicit and reversible", async () => {
  const database = await openScriptDatabase(TEST_ENVIRONMENT);
  const original = process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
  process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = "true";
  try {
    await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
    const rolledBack = await rollbackLatestMigration(database, TEST_ENVIRONMENT);
    assert.equal(rolledBack, "0001_platform_foundation");
    const status = await migrationStatus(database);
    assert.equal(status[0].applied, false);
    const reapplied = await applyPendingMigrations(database, TEST_ENVIRONMENT.releaseSha);
    assert.deepEqual(reapplied, ["0001_platform_foundation"]);
  } finally {
    if (original === undefined) {
      delete process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
    } else {
      process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = original;
    }
    await database.close();
  }
});
