import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW,
  countRows,
  seedInProgressAttempt,
  seedWorkerPrincipal
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST is required");
const repositoryModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-recovery-repository.js")).href
);
const { AssessmentAttemptRecoveryRepository } = repositoryModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-repository-runtime",
  sessionSecret: "m2-08-draft-repository-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-repository-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_recovery");
  return db;
}

test("M2.08 draft repository rejects wrong runtime value types instead of coercing them", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-repository-coercion");
    const fixture = await seedInProgressAttempt(db, principal, "draft-repository-coercion", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const repository = new AssessmentAttemptRecoveryRepository(db);

    await assert.rejects(
      repository.insertDraft({
        attemptId: fixture.attemptId,
        formId: fixture.formId,
        formItemId: item.formItemId,
        position: item.position,
        questionId: item.questionId,
        questionVersionId: item.questionVersionId,
        questionType: item.questionType,
        value: "false",
        mutationKey: "mutation-draft-repository-coercion",
        mutationDigest: "0".repeat(64),
        now: ATTEMPT_NOW
      }),
      /draft value type is invalid/i
    );

    assert.equal(
      await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]),
      0
    );
  } finally {
    await db.close();
  }
});