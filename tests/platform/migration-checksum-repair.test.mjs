import assert from "node:assert/strict";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import {
  applyPendingMigrations,
  listMigrations,
  migrationChecksumCompatibility,
  migrationStatus
} from "../../scripts/lib/migrations.mjs";

const REPAIRS = Object.freeze([
  Object.freeze({
    id: "0012_secure_file_upload_quarantine",
    legacyChecksum:
      "ca17b96eb02983a365bf2a560b4e2428f90efa0b9e845ea550e9ff7d227b04e5",
    repairedChecksum:
      "98507fbb39bfeba540a2a06b71e727f28123d35489a89b562dce8396e790af1b"
  }),
  Object.freeze({
    id: "0013_secure_file_malware_scan",
    legacyChecksum:
      "b20f0a844faee01315562d9673a75df0494908259a7997d4a0d9e421bb0742d2",
    repairedChecksum:
      "8156083e26ac2c3ad354eddd44b13af801898db2d1cba35f2441c26ac2a18280"
  })
]);
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

test("migration checksum repairs are pinned to exact historical/current pairs", async () => {
  const migrations = await listMigrations();
  for (const repair of REPAIRS) {
    const migration = migrations.find((entry) => entry.id === repair.id);
    assert.ok(migration, `${repair.id} must remain registered`);
    assert.equal(migration.checksum, repair.repairedChecksum);

    assert.equal(
      migrationChecksumCompatibility(
        repair.id,
        repair.repairedChecksum,
        repair.repairedChecksum
      ),
      "exact"
    );
    assert.equal(
      migrationChecksumCompatibility(
        repair.id,
        repair.legacyChecksum,
        repair.repairedChecksum
      ),
      "approved_repair"
    );
    assert.equal(
      migrationChecksumCompatibility(
        repair.id,
        INVALID_CHECKSUM,
        repair.repairedChecksum
      ),
      "mismatch"
    );
    assert.equal(
      migrationChecksumCompatibility(
        repair.id,
        repair.legacyChecksum,
        INVALID_CHECKSUM
      ),
      "mismatch",
      "a later unapproved edit must not inherit a historical checksum exception"
    );
  }
});

test("approved legacy checksums normalize once while every unknown mismatch still fails closed", async () => {
  const database = await openScriptDatabase(ENVIRONMENT);
  try {
    await applyPendingMigrations(database, ENVIRONMENT.releaseSha);

    for (const repair of REPAIRS) {
      await database.query(
        "UPDATE hse_schema_migrations SET checksum = $1 WHERE migration_id = $2",
        [repair.legacyChecksum, repair.id]
      );
    }

    let status = await migrationStatus(database);
    for (const repair of REPAIRS) {
      const entry = status.find((item) => item.id === repair.id);
      assert.equal(entry?.checksumMatches, true);
      assert.equal(entry?.checksumCompatibility, "approved_repair");
      assert.equal(entry?.appliedChecksum, repair.legacyChecksum);
    }

    assert.deepEqual(
      await applyPendingMigrations(database, "migration-checksum-repair-normalize"),
      []
    );

    for (const repair of REPAIRS) {
      const normalizedLedger = await database.query(
        "SELECT checksum, release_sha FROM hse_schema_migrations WHERE migration_id = $1",
        [repair.id]
      );
      assert.equal(normalizedLedger.rows[0].checksum, repair.repairedChecksum);
      assert.equal(
        normalizedLedger.rows[0].release_sha,
        ENVIRONMENT.releaseSha,
        "metadata repair must not rewrite the release that originally applied the migration"
      );
    }

    const tampered = REPAIRS[1];
    await database.query(
      "UPDATE hse_schema_migrations SET checksum = $1 WHERE migration_id = $2",
      [INVALID_CHECKSUM, tampered.id]
    );
    status = await migrationStatus(database);
    const invalid = status.find((entry) => entry.id === tampered.id);
    assert.equal(invalid?.checksumMatches, false);
    assert.equal(invalid?.checksumCompatibility, "mismatch");
    await assert.rejects(
      () => applyPendingMigrations(database, "must-not-run"),
      /Applied migration checksum mismatch: 0013_secure_file_malware_scan/
    );
  } finally {
    await database.close();
  }
});
