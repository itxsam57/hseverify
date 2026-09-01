import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW_DATE,
  countRows,
  seedInProgressAttempt,
  seedWorkerPrincipal
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST is required");
const { AssessmentAttemptService } = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-commit-runtime",
  sessionSecret: "m2-08-draft-commit-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-commit-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_drafts");
  return db;
}

async function saveDraft(service, principal, fixture, item, value, mutationKey) {
  return service.saveCurrentDraft(
    principal,
    {
      attemptId: fixture.attemptId,
      position: item.position,
      questionVersionId: item.questionVersionId,
      value,
      expectedRevision: null,
      mutationKey
    },
    ATTEMPT_NOW_DATE
  );
}

test("M2.08 successful Next atomically removes the matching current-question draft before progression", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-cleanup-next");
    const fixture = await seedInProgressAttempt(db, principal, "draft-cleanup-next", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const [first, second] = fixture.items;
    const service = new AssessmentAttemptService(db);

    await saveDraft(
      service,
      principal,
      fixture,
      first,
      "  uncommitted draft text  ",
      "m208-draft-cleanup-next-0001"
    );
    assert.equal(
      await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]),
      1
    );

    const after = await service.submitCurrentAnswer(
      principal,
      {
        attemptId: fixture.attemptId,
        position: first.position,
        questionVersionId: first.questionVersionId,
        answer: "Committed answer"
      },
      ATTEMPT_NOW_DATE
    );

    assert.equal(
      await countRows(db, "assessment_attempt_answers", "attempt_id=$1 AND position=1", [fixture.attemptId]),
      1
    );
    assert.equal(
      await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    assert.equal(after.currentQuestion.position, 2);
    assert.equal(after.currentQuestion.questionVersionId, second.questionVersionId);
    assert.equal(after.currentDraft, null);
  } finally {
    await db.close();
  }
});
