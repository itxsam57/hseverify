import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW_DATE,
  seedInProgressAttempt,
  seedWorkerPrincipal
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST is required");
const serviceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-recovery-service.js")).href
);
const recoveryDomain = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-recovery-domain.js")).href
);
const { AssessmentAttemptRecoveryService } = serviceModule;
const { AssessmentDraftConflictError } = recoveryDomain;

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

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_recovery");
  return db;
}

function saveInput(fixture, item, value, mutationKey, expectedRevision) {
  return {
    attemptId: fixture.attemptId,
    position: item.position,
    questionVersionId: item.questionVersionId,
    value,
    expectedRevision,
    mutationKey
  };
}

async function draftRow(db, attemptId) {
  const result = await db.query(
    `SELECT revision,text_value,boolean_value,latest_mutation_key,latest_mutation_digest
     FROM assessment_attempt_drafts WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

test("M2.08 latest mutation retry is idempotent and key reuse with different payload fails closed", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-idempotency");
    const fixture = await seedInProgressAttempt(db, principal, "draft-idempotency", [
      { questionType: "SHORT_TEXT" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);
    const request = saveInput(
      fixture,
      item,
      "first exact value",
      "mutation-draft-idempotency-1",
      null
    );

    const first = await service.saveDraft(principal, request, ATTEMPT_NOW_DATE);
    const replay = await service.saveDraft(
      principal,
      request,
      new Date(ATTEMPT_NOW_DATE.getTime() + 5_000)
    );
    assert.deepEqual(replay, first);
    assert.equal(replay.revision, 1);

    await assert.rejects(
      service.saveDraft(
        principal,
        { ...request, value: "different payload" },
        ATTEMPT_NOW_DATE
      ),
      AssessmentDraftConflictError
    );

    const row = await draftRow(db, fixture.attemptId);
    assert.equal(Number(row.revision), 1);
    assert.equal(row.text_value, "first exact value");
    assert.equal(row.latest_mutation_key, "mutation-draft-idempotency-1");
    assert.match(String(row.latest_mutation_digest), /^[a-f0-9]{64}$/);
  } finally {
    await db.close();
  }
});

test("M2.08 stale expected revision returns the safe current draft and cannot overwrite newer state", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-stale-revision");
    const fixture = await seedInProgressAttempt(db, principal, "draft-stale-revision", [
      { questionType: "DECIMAL" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);

    await service.saveDraft(
      principal,
      saveInput(fixture, item, "1.", "mutation-draft-stale-1", null),
      ATTEMPT_NOW_DATE
    );
    const current = await service.saveDraft(
      principal,
      saveInput(fixture, item, "12.5", "mutation-draft-stale-2", 1),
      new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
    );
    assert.equal(current.revision, 2);

    await assert.rejects(
      service.saveDraft(
        principal,
        saveInput(fixture, item, "old delayed value", "mutation-draft-stale-old", 1),
        new Date(ATTEMPT_NOW_DATE.getTime() + 2_000)
      ),
      (error) => {
        assert.equal(error instanceof AssessmentDraftConflictError, true);
        assert.equal(error.currentDraft?.revision, 2);
        assert.equal(error.currentDraft?.value, "12.5");
        return true;
      }
    );

    const row = await draftRow(db, fixture.attemptId);
    assert.equal(Number(row.revision), 2);
    assert.equal(row.text_value, "12.5");
    assert.equal(row.latest_mutation_key, "mutation-draft-stale-2");
  } finally {
    await db.close();
  }
});

test("M2.08 two concurrent writers from one revision serialize to one winner and one controlled conflict", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-race");
    const fixture = await seedInProgressAttempt(db, principal, "draft-race", [
      { questionType: "SHORT_TEXT" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);

    await service.saveDraft(
      principal,
      saveInput(fixture, item, "base", "mutation-draft-race-base", null),
      ATTEMPT_NOW_DATE
    );

    const settled = await Promise.allSettled([
      service.saveDraft(
        principal,
        saveInput(fixture, item, "writer A", "mutation-draft-race-a", 1),
        new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
      ),
      service.saveDraft(
        principal,
        saveInput(fixture, item, "writer B", "mutation-draft-race-b", 1),
        new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
      )
    ]);

    assert.equal(settled.filter((entry) => entry.status === "fulfilled").length, 1);
    assert.equal(settled.filter((entry) => entry.status === "rejected").length, 1);
    const rejected = settled.find((entry) => entry.status === "rejected");
    assert.equal(rejected.reason instanceof AssessmentDraftConflictError, true);
    assert.equal(rejected.reason.currentDraft?.revision, 2);

    const row = await draftRow(db, fixture.attemptId);
    assert.equal(Number(row.revision), 2);
    assert.ok(["writer A", "writer B"].includes(row.text_value));
    assert.ok([
      "mutation-draft-race-a",
      "mutation-draft-race-b"
    ].includes(row.latest_mutation_key));
  } finally {
    await db.close();
  }
});
