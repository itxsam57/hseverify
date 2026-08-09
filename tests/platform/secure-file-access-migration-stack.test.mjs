import assert from "node:assert/strict";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import {
  applyPendingMigrations,
  listMigrations,
  rollbackLatestMigration
} from "../../scripts/lib/migrations.mjs";

const ENVIRONMENT = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "secure-file-access-migration-stack",
  sessionSecret: "secure-file-access-migration-session-secret-32-chars",
  authPepper: "secure-file-access-migration-auth-pepper-32-chars",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};
const MIGRATION_ID = "0014_secure_file_signed_access_audit";
const FILE_REF = `secure_file_${"R".repeat(24)}`;

async function insertAccessAudit(database, id, action, purpose) {
  await database.query(
    `INSERT INTO platform_audit_events (
       audit_event_id, source_kind, action_key, outcome,
       target_type, target_reference, metadata
     ) VALUES ($1, 'native', $2, 'succeeded',
       'secure_file', $3, $4::jsonb)`,
    [id, action, FILE_REF, JSON.stringify({ purpose })]
  );
}

test("signed access audit vocabulary rollback is monotonic and reapply-safe", async () => {
  const database = await openScriptDatabase(ENVIRONMENT);
  try {
    const migrations = await listMigrations();
    const ownIndex = migrations.findIndex((migration) => migration.id === MIGRATION_ID);
    assert.ok(ownIndex >= 0, `${MIGRATION_ID} must remain registered`);

    await applyPendingMigrations(database, ENVIRONMENT.releaseSha);
    await insertAccessAudit(
      database,
      "audit_access_migration_authorized",
      "secure_file.access.authorized",
      "preview"
    );

    const rollbackCount = migrations.length - ownIndex;
    for (let index = 0; index < rollbackCount; index += 1) {
      const rolledBack = await rollbackLatestMigration(database);
      assert.ok(rolledBack, "Expected one applied migration to roll back");
    }

    const historyAfterRollback = await database.query(
      `SELECT status FROM platform_schema_migrations WHERE migration_id = $1`,
      [MIGRATION_ID]
    );
    assert.equal(historyAfterRollback.rows[0]?.status, "rolled_back");

    const preserved = await database.query(
      `SELECT action_key, metadata
       FROM platform_audit_events
       WHERE audit_event_id = 'audit_access_migration_authorized'`
    );
    assert.equal(preserved.rows.length, 1);
    assert.equal(preserved.rows[0].action_key, "secure_file.access.authorized");
    assert.deepEqual(preserved.rows[0].metadata, { purpose: "preview" });

    // The down migration is intentionally monotonic: immutable historical
    // vocabulary remains legal while its migration is logically rolled back.
    await insertAccessAudit(
      database,
      "audit_access_migration_served",
      "secure_file.access.served",
      "download"
    );

    await applyPendingMigrations(database, `${ENVIRONMENT.releaseSha}-reapply`);
    const historyAfterReapply = await database.query(
      `SELECT status FROM platform_schema_migrations WHERE migration_id = $1`,
      [MIGRATION_ID]
    );
    assert.equal(historyAfterReapply.rows[0]?.status, "applied");

    await insertAccessAudit(
      database,
      "audit_access_migration_reapplied",
      "secure_file.access.authorized",
      "download"
    );
    const finalRows = await database.query(
      `SELECT audit_event_id
       FROM platform_audit_events
       WHERE audit_event_id LIKE 'audit_access_migration_%'
       ORDER BY audit_sequence`
    );
    assert.deepEqual(
      finalRows.rows.map((row) => row.audit_event_id),
      [
        "audit_access_migration_authorized",
        "audit_access_migration_served",
        "audit_access_migration_reapplied"
      ]
    );
  } finally {
    await database.close();
  }
});
