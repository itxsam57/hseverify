import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW,
  seedInProgressAttempt,
  seedWorkerPrincipal
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_ATTEMPT_DRAFT_REPOSITORY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_ATTEMPT_DRAFT_REPOSITORY_RUNTIME_DIST is required");
const repositoryModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-repository.js")).href
);
const { AssessmentAttemptRepository } = repositoryModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-concurrency-runtime",
  sessionSecret: "m2-08-draft-concurrency-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-concurrency-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function currentStored(db, attemptId) {
  const result = await db.query(
    `SELECT revision,text_value,latest_mutation_key
     FROM assessment_attempt_drafts
     WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

function splitSettled(results) {
  return {
    fulfilled: results.filter((result) => result.status === "fulfilled"),
    rejected: results.filter((result) => result.status === "rejected")
  };
}

test("concurrent first writers and same-revision writers cannot silently overwrite each other", async () => {
  const db = await openScriptDatabase(ENV);
  try {
    await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_drafts");
    const principal = await seedWorkerPrincipal(db, "draft-concurrency");
    const fixture = await seedInProgressAttempt(db, principal, "draft-concurrency", [
      { questionType: "SHORT_TEXT" }
    ]);
    const repositoryA = new AssessmentAttemptRepository(db);
    const repositoryB = new AssessmentAttemptRepository(db);
    const attempt = await repositoryA.findOwned(principal.accountId, fixture.attemptId);
    const item = await repositoryA.loadCurrentPinnedItem(principal.accountId, fixture.attemptId);
    assert.ok(attempt);
    assert.ok(item);

    const firstRace = splitSettled(
      await Promise.allSettled([
        repositoryA.saveCurrentDraftCompareAndSwap({
          attempt,
          item,
          value: "first writer A",
          expectedRevision: null,
          mutationKey: "draft-concurrency-first-a",
          now: ATTEMPT_NOW
        }),
        repositoryB.saveCurrentDraftCompareAndSwap({
          attempt,
          item,
          value: "first writer B",
          expectedRevision: null,
          mutationKey: "draft-concurrency-first-b",
          now: ATTEMPT_NOW
        })
      ])
    );
    assert.equal(firstRace.fulfilled.length, 1);
    assert.equal(firstRace.rejected.length, 1);

    const afterFirst = await currentStored(db, attempt.attemptId);
    assert.ok(afterFirst);
    assert.equal(Number(afterFirst.revision), 1);
    assert.ok(["first writer A", "first writer B"].includes(afterFirst.text_value));

    const updateRace = splitSettled(
      await Promise.allSettled([
        repositoryA.saveCurrentDraftCompareAndSwap({
          attempt,
          item,
          value: "revision two A",
          expectedRevision: 1,
          mutationKey: "draft-concurrency-update-a",
          now: ATTEMPT_NOW
        }),
        repositoryB.saveCurrentDraftCompareAndSwap({
          attempt,
          item,
          value: "revision two B",
          expectedRevision: 1,
          mutationKey: "draft-concurrency-update-b",
          now: ATTEMPT_NOW
        })
      ])
    );
    assert.equal(updateRace.fulfilled.length, 1);
    assert.equal(updateRace.rejected.length, 1);

    const afterUpdate = await currentStored(db, attempt.attemptId);
    assert.ok(afterUpdate);
    assert.equal(Number(afterUpdate.revision), 2);
    assert.ok(["revision two A", "revision two B"].includes(afterUpdate.text_value));

    const winningResult = updateRace.fulfilled[0].value;
    assert.equal(winningResult.revision, 2);
    assert.equal(winningResult.value, afterUpdate.text_value);
  } finally {
    await db.close();
  }
});
