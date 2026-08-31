import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-07-attempt-rollback-runtime",
  sessionSecret: "m2-07-attempt-rollback-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-07-attempt-rollback-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function relationExists(db, relation) {
  const result = await db.query(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${relation}`]
  );
  return result.rows[0]?.exists === true;
}

test("M2.07 down removes only attempt-owned schema and reapply restores it", async () => {
  const db = await openScriptDatabase(ENV);
  try {
    await applyMigrationsThrough(db, ENV.releaseSha, "0042_assessment_attempt_lifecycle");

    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
    assert.equal(await relationExists(db, "generated_assessment_forms"), true);
    assert.equal(await relationExists(db, "generated_assessment_form_items"), true);

    const down = await readFile(
      resolve("database/migrations/0042_assessment_attempt_lifecycle.down.sql"),
      "utf8"
    );
    const up = await readFile(
      resolve("database/migrations/0042_assessment_attempt_lifecycle.up.sql"),
      "utf8"
    );

    await db.execute(down);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), false);
    assert.equal(await relationExists(db, "assessment_attempts"), false);
    assert.equal(await relationExists(db, "generated_assessment_forms"), true);
    assert.equal(await relationExists(db, "generated_assessment_form_items"), true);

    await db.execute(up);
    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
  } finally {
    await db.close();
  }
});
