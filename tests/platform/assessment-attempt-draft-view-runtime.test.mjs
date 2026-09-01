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

const runtime = process.env.HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST is required");

const serviceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);
const clientViewModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-client-view.js")).href
);

const {
  AssessmentAttemptService,
  AssessmentAttemptAccessError
} = serviceModule;
const { toAssessmentAttemptClientView } = clientViewModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-view-runtime",
  sessionSecret: "m2-08-draft-view-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-view-auth-pepper-more-than-thirty-two-characters",
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

async function setup(db, seed, questions = [{ questionType: "SHORT_TEXT" }]) {
  const worker = await seedWorkerPrincipal(db, seed);
  const fixture = await seedInProgressAttempt(db, worker, seed, questions);
  return { worker, fixture, service: new AssessmentAttemptService(db) };
}

function saveInput(fixture, value, mutationKey) {
  return {
    attemptId: fixture.attemptId,
    position: 1,
    questionVersionId: fixture.items[0].questionVersionId,
    value,
    expectedRevision: null,
    mutationKey
  };
}

function assertSafeClientView(client) {
  assert.deepEqual(
    Object.keys(client).sort(),
    ["currentDraft", "currentQuestion", "submitted"].sort()
  );

  if (client.currentDraft !== null) {
    assert.deepEqual(
      Object.keys(client.currentDraft).sort(),
      ["revision", "updatedAt", "value"].sort()
    );
  }

  if (client.currentQuestion !== null) {
    assert.deepEqual(
      Object.keys(client.currentQuestion).sort(),
      [
        "attemptId",
        "difficulty",
        "domainReference",
        "options",
        "position",
        "prompt",
        "questionCount",
        "questionId",
        "questionType",
        "questionVersionId",
        "tags"
      ].sort()
    );
  }

  const forbiddenKeys = new Set([
    "answerKey",
    "answer_key",
    "blueprintVersionId",
    "catalogueVersionId",
    "correct",
    "correctness",
    "digest",
    "formId",
    "formItemId",
    "latestMutationDigest",
    "latestMutationKey",
    "mutationDigest",
    "mutationKey",
    "pass",
    "passed",
    "reviewer",
    "rubric",
    "score",
    "workerAccountId"
  ]);

  const visit = (value) => {
    if (value === null || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value)) {
      assert.equal(
        forbiddenKeys.has(key),
        false,
        `client assessment view leaked forbidden key ${key}`
      );
      visit(nested);
    }
  };
  visit(client);
}

test("owned reload returns the exact acknowledged whitespace draft through the safe client projection", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-view-whitespace");
    const saved = await service.saveCurrentDraft(
      worker,
      saveInput(fixture, "  exact whitespace draft  ", "draft-view-whitespace-key"),
      ATTEMPT_NOW_DATE
    );

    const reloaded = await service.getOwnedView(worker, fixture.attemptId, ATTEMPT_NOW_DATE);
    assert.deepEqual(reloaded.currentDraft, saved);

    const client = toAssessmentAttemptClientView(reloaded);
    assert.deepEqual(client.currentDraft, saved);
    assert.equal(client.currentDraft.value, "  exact whitespace draft  ");
    assertSafeClientView(client);
  } finally {
    await db.close();
  }
});

test("an in-progress attempt with no server draft projects currentDraft as null", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-view-empty");
    const reloaded = await service.getOwnedView(worker, fixture.attemptId, ATTEMPT_NOW_DATE);
    assert.equal(reloaded.currentDraft, null);

    const client = toAssessmentAttemptClientView(reloaded);
    assert.equal(client.currentDraft, null);
    assertSafeClientView(client);
  } finally {
    await db.close();
  }
});

test("reload preserves a partial decimal edit state exactly instead of committed-answer normalization", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-view-partial-decimal", [
      { questionType: "DECIMAL" }
    ]);
    const saved = await service.saveCurrentDraft(
      worker,
      saveInput(fixture, "1.", "draft-view-partial-decimal-key"),
      ATTEMPT_NOW_DATE
    );
    assert.equal(saved.value, "1.");

    const reloaded = await service.getOwnedView(worker, fixture.attemptId, ATTEMPT_NOW_DATE);
    assert.equal(reloaded.currentDraft.value, "1.");
    assert.equal(toAssessmentAttemptClientView(reloaded).currentDraft.value, "1.");
  } finally {
    await db.close();
  }
});

test("another Worker cannot read an owned draft through the assessment view", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-view-owner");
    const other = await seedWorkerPrincipal(db, "draft-view-other");
    await service.saveCurrentDraft(
      worker,
      saveInput(fixture, "private draft", "draft-view-owner-key"),
      ATTEMPT_NOW_DATE
    );

    await assert.rejects(
      service.getOwnedView(other, fixture.attemptId, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );
  } finally {
    await db.close();
  }
});

test("a submitted receipt exposes no stale draft even if one existed before commit", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-view-submitted");
    await service.saveCurrentDraft(
      worker,
      saveInput(fixture, "uncommitted text", "draft-view-submitted-key"),
      ATTEMPT_NOW_DATE
    );
    await service.submitCurrentAnswer(
      worker,
      {
        attemptId: fixture.attemptId,
        position: 1,
        questionVersionId: fixture.items[0].questionVersionId,
        answer: "Committed final response"
      },
      ATTEMPT_NOW_DATE
    );

    const receipt = await service.getOwnedView(worker, fixture.attemptId, ATTEMPT_NOW_DATE);
    assert.equal(receipt.submitted, true);
    assert.equal(receipt.currentQuestion, null);
    assert.equal(receipt.currentDraft, null);

    const client = toAssessmentAttemptClientView(receipt);
    assert.equal(client.currentDraft, null);
    assertSafeClientView(client);
  } finally {
    await db.close();
  }
});
