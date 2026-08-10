import assert from "node:assert/strict";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import {
  applyPendingMigrations,
  listMigrations,
  migrationChecksumCompatibility,
  migrationStatus
} from "../../scripts/lib/migrations.mjs";

const REPAIRED_MIGRATION_ID = "0012_secure_file_upload_quarantine";
const LEGACY_CHECKSUM =
  "ca17b96eb02983a365bf2a560b4e2428f90efa0b9e845ea550e9ff7d227b04e5";
const REPAIRED_CHECKSUM =
  "98507fbb39bfeba540a2a06b71e727f28123d35489a89b562dce8396e790af1b";
const INVALID_CHECKSUM = "0".repeat(64);

const ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "migration-checksum-repair-test",
  sessionSecret: "migration-checksum-repair-session-secret-32-chars",
  authPepper: "migration-checksum-repair-auth-pepper-32-chars",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

test("migration checksum repair is pinned to one legacy/current pair", async () => {
  const migration = (await listMigrations()).find(
    (entry) => entry.id === REPAIRED_MIGRATION_ID
  );
  assert.ok(migration, "repaired migration must remain registered");
  assert.equal(migration.checksum, REPAIRED_CHECKSUM);

  assert.equal(
    migrationChecksumCompatibility(
      REPAIRED_MIGRATION_ID,
      REPAIRED_CHECKSUM,
      REPAIRED_CHECKSUM
    ),
    "exact"
  );
  assert.equal(
    migrationChecksumCompatibility(
      REPAIRED_MIGRATION_ID,
      LEGACY_CHECKSUM,
      REPAIRED_CHECKSUM
    ),
    "approved_repair"
  );
  assert.equal(
    migrationChecksumCompatibility(
      REPAIRED_MIGRATION_ID,
      INVALID_CHECKSUM,
      REPAIRED_CHECKSUM
    ),
    "mismatch"
  );
  assert.equal(
    migrationChecksumCompatibility(
      REPAIRED_MIGRATION_ID,
      LEGACY_CHECKSUM,
      INVALID_CHECKSUM
    ),
    "mismatch",
    "a later unapproved edit must not inherit the historical checksum exception"
  );
});

test("approved legacy checksum is normalized once while every unknown mismatch still fails closed", async () => {
  const database = await openScriptDatabase(ENVIRONMENT);
  try {
    await applyPendingMigrations(database, ENVIRONMENT.releaseSha);

    await database.query(
      "UPDATE hse_schema_migrations SET checksum = $1 WHERE migration_id = $2",
      [LEGACY_CHECKSUM, REPAIRED_MIGRATION_ID]
    );
    let repaired = (await migrationStatus(database)).find(
      (entry) => entry.id === REPAIRED_MIGRATION_ID
    );
    assert.equal(repaired?.checksumMatches, true);
    assert.equal(repaired?.checksumCompatibility, "approved_repair");
    assert.equal(repaired?.appliedChecksum, LEGACY_CHECKSUM);

    assert.deepEqual(
      await applyPendingMigrations(database, "migration-checksum-repair-normalize"),
      []
    );
    const normalizedLedger = await database.query(
      "SELECT checksum, release_sha FROM hse_schema_migrations WHERE migration_id = $1",
      [REPAIRED_MIGRATION_ID]
    );
    assert.equal(normalizedLedger.rows[0].checksum, REPAIRED_CHECKSUM);
    assert.equal(
      normalizedLedger.rows[0].release_sha,
      ENVIRONMENT.releaseSha,
      "metadata repair must not rewrite the release that originally applied the migration"
    );

    await database.query(
      "UPDATE hse_schema_migrations SET checksum = $1 WHERE migration_id = $2",
      [INVALID_CHECKSUM, REPAIRED_MIGRATION_ID]
    );
    repaired = (await migrationStatus(database)).find(
      (entry) => entry.id === REPAIRED_MIGRATION_ID
    );
    assert.equal(repaired?.checksumMatches, false);
    assert.equal(repaired?.checksumCompatibility, "mismatch");
    await assert.rejects(
      () => applyPendingMigrations(database, "must-not-run"),
      /Applied migration checksum mismatch: 0012_secure_file_upload_quarantine/
    );
  } finally {
    await database.close();
  }
});
