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
  releaseSha: "m2-08-draft-rollback-runtime",
  sessionSecret: "m2-08-draft-rollback-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-rollback-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function relationExists(db, relation) {
  const result = await db.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [`public.${relation}`]
  );
  return result.rows[0]?.exists === true;
}

test("M2.08 down removes only draft-owned schema and reapply restores it", async () => {
  const db = await openScriptDatabase(ENV);
  try {
    await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_drafts");

    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
    assert.equal(await relationExists(db, "assessment_attempt_drafts"), true);

    const down = await readFile(
      resolve("database/migrations/0043_assessment_attempt_drafts.down.sql"),
      "utf8"
    );
    const up = await readFile(
      resolve("database/migrations/0043_assessment_attempt_drafts.up.sql"),
      "utf8"
    );

    await db.execute(down);

    assert.equal(await relationExists(db, "assessment_attempt_drafts"), false);
    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
    assert.equal(await relationExists(db, "generated_assessment_forms"), true);
    assert.equal(await relationExists(db, "generated_assessment_form_items"), true);

    await db.execute(up);

    assert.equal(await relationExists(db, "assessment_attempt_drafts"), true);
    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
  } finally {
    await db.close();
  }
});
