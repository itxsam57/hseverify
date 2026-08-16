import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyPendingMigrations, migrationStatus, rollbackLatestMigration } from "../../scripts/lib/migrations.mjs";

const OWNED_MIGRATION = "0028_company_worker_invitations_codes";

function environment(path, releaseSha) {
  return {
    appEnvironment: "test",
    databaseDriver: "pglite",
    databaseUrl: null,
    pgliteDataDir: path,
    releaseSha,
    sessionSecret: "m1-10-migration-session-secret-with-more-than-thirty-two-characters",
    authPepper: "m1-10-migration-auth-pepper-with-more-than-thirty-two-characters",
    authSandboxEnabled: false,
    authSandboxAccessKey: null,
    demoAuthEnabled: false,
    demoDataEnabled: false
  };
}

test("M1.10 migration is monotonic, restart-safe and rollback/reapply-safe", async () => {
  const directory = await mkdtemp(join(tmpdir(), "hseverify-m110-migration-"));
  const databasePath = join(directory, "pglite");
  const env = environment(databasePath, "m1-10-red-green-migration");
  const previous = process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
  process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = "true";
  let database = await openScriptDatabase(env);
  try {
    const applied = await applyPendingMigrations(database, env.releaseSha);
    assert.equal(applied.at(-1), OWNED_MIGRATION);
    const tables = await database.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema='public' AND table_name IN (
         'company_worker_invitations','company_registration_codes','company_worker_links'
       ) ORDER BY table_name`
    );
    assert.deepEqual(tables.rows.map((row) => row.table_name), ["company_registration_codes", "company_worker_invitations", "company_worker_links"]);

    await database.close();
    database = await openScriptDatabase({ ...env, releaseSha: "m1-10-restart" });
    const statusAfterRestart = await migrationStatus(database);
    assert.equal(statusAfterRestart.every((entry) => entry.applied && entry.checksumMatches), true);

    const rolledBack = await rollbackLatestMigration(database, env);
    assert.equal(rolledBack, OWNED_MIGRATION);
    const afterRollback = await migrationStatus(database);
    assert.equal(afterRollback.find((entry) => entry.id === OWNED_MIGRATION)?.applied, false);

    assert.deepEqual(await applyPendingMigrations(database, "m1-10-reapply"), [OWNED_MIGRATION]);
    const finalStatus = await migrationStatus(database);
    assert.equal(finalStatus.every((entry) => entry.applied && entry.checksumMatches), true);
  } finally {
    if (database) await database.close();
    if (previous === undefined) delete process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK;
    else process.env.HSE_ALLOW_DESTRUCTIVE_DB_ROLLBACK = previous;
    await rm(directory, { recursive: true, force: true });
  }
});
