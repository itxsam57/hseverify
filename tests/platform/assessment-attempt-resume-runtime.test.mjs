import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW,
  ATTEMPT_NOW_DATE,
  seedInProgressAttempt,
  seedWorkerPrincipal
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST is required");
const serviceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);
const {
  AssessmentAttemptService,
  AssessmentAttemptAccessError
} = serviceModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-task6-resume-runtime",
  sessionSecret: "m2-08-task6-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-task6-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(
    db,
    ENV.releaseSha,
    process.env.HSE_TEST_MIGRATION_CEILING ?? "0043_assessment_attempt_drafts"
  );
  return db;
}

async function storedCatalogueMetadata(db, catalogueVersionId) {
  const result = await db.query(
    `SELECT e.catalogue_reference,v.title,v.description
     FROM assessment_catalogue_versions v
     JOIN assessment_catalogue_entries e
       ON e.catalogue_entry_id=v.catalogue_entry_id
     WHERE v.catalogue_version_id=$1`,
    [catalogueVersionId]
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}

test("live Worker resume listing returns only owned consistent IN_PROGRESS attempts with bounded metadata", async () => {
  const db = await database();
  try {
    const owner = await seedWorkerPrincipal(db, "task6-owner");
    const foreign = await seedWorkerPrincipal(db, "task6-foreign");
    const keep = await seedInProgressAttempt(db, owner, "task6-keep", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const submitted = await seedInProgressAttempt(db, owner, "task6-submitted", [
      { questionType: "SHORT_TEXT" }
    ]);
    const inconsistent = await seedInProgressAttempt(db, owner, "task6-inconsistent", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] }
    ]);
    await seedInProgressAttempt(db, foreign, "task6-foreign-attempt", [
      { questionType: "TRUE_FALSE" }
    ]);

    const service = new AssessmentAttemptService(db);
    await service.saveCurrentDraft(
      owner,
      {
        attemptId: keep.attemptId,
        position: 1,
        questionVersionId: keep.items[0].questionVersionId,
        value: "  resume secret draft  ",
        expectedRevision: null,
        mutationKey: "task6-resume-secret"
      },
      ATTEMPT_NOW_DATE
    );
    await service.submitCurrentAnswer(
      owner,
      {
        attemptId: submitted.attemptId,
        position: 1,
        questionVersionId: submitted.items[0].questionVersionId,
        answer: "submitted response"
      },
      ATTEMPT_NOW_DATE
    );
    await db.query(
      `UPDATE assurance_cases
       SET assessment_reference=NULL,updated_at=$2
       WHERE case_id=$1`,
      [inconsistent.caseId, ATTEMPT_NOW]
    );

    const list = await service.listOwnedInProgress(owner, ATTEMPT_NOW_DATE);
    assert.equal(list.length, 1);
    const metadata = await storedCatalogueMetadata(db, keep.catalogueVersionId);
    assert.deepEqual(list[0], {
      attemptId: keep.attemptId,
      caseId: keep.caseId,
      catalogueVersionId: keep.catalogueVersionId,
      catalogueReference: metadata.catalogue_reference,
      title: metadata.title,
      description: metadata.description,
      currentPosition: 1,
      questionCount: 2,
      startedAt: ATTEMPT_NOW
    });

    assert.deepEqual(Object.keys(list[0]).sort(), [
      "attemptId",
      "caseId",
      "catalogueReference",
      "catalogueVersionId",
      "currentPosition",
      "description",
      "questionCount",
      "startedAt",
      "title"
    ].sort());
    const serialized = JSON.stringify(list);
    for (const forbidden of [
      "resume secret draft",
      "currentDraft",
      "mutationKey",
      "mutationDigest",
      "questionVersionId",
      "formId",
      "formItemId",
      "answerKey",
      "rubric",
      "correct",
      "score",
      "passFail",
      foreign.accountId,
      submitted.attemptId,
      inconsistent.attemptId
    ]) {
      assert.equal(serialized.includes(forbidden), false, `resume listing leaked ${forbidden}`);
    }
  } finally {
    await db.close();
  }
});

test("resume listing reports current progress without exposing the current question or draft", async () => {
  const db = await database();
  try {
    const owner = await seedWorkerPrincipal(db, "task6-progress");
    const fixture = await seedInProgressAttempt(db, owner, "task6-progress", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] },
      { questionType: "DECIMAL" },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);

    await service.submitCurrentAnswer(
      owner,
      {
        attemptId: fixture.attemptId,
        position: 1,
        questionVersionId: fixture.items[0].questionVersionId,
        answer: "Bravo"
      },
      ATTEMPT_NOW_DATE
    );
    await service.saveCurrentDraft(
      owner,
      {
        attemptId: fixture.attemptId,
        position: 2,
        questionVersionId: fixture.items[1].questionVersionId,
        value: "1.",
        expectedRevision: null,
        mutationKey: "task6-progress-draft"
      },
      ATTEMPT_NOW_DATE
    );

    const list = await service.listOwnedInProgress(owner, ATTEMPT_NOW_DATE);
    assert.equal(list.length, 1);
    assert.equal(list[0].currentPosition, 2);
    assert.equal(list[0].questionCount, 3);
    const serialized = JSON.stringify(list[0]);
    assert.equal(serialized.includes("1."), false);
    assert.equal(serialized.includes(fixture.items[1].questionVersionId), false);
  } finally {
    await db.close();
  }
});

test("resume listing fails closed for non-Worker and revoked principals", async () => {
  const db = await database();
  try {
    const owner = await seedWorkerPrincipal(db, "task6-auth");
    await seedInProgressAttempt(db, owner, "task6-auth", [
      { questionType: "SHORT_TEXT" }
    ]);
    const service = new AssessmentAttemptService(db);

    await assert.rejects(
      service.listOwnedInProgress(
        { ...owner, activeRole: "admin" },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptAccessError
    );

    await db.query(
      `UPDATE auth_sessions
       SET revoked_at=$2,revocation_reason='task6-test'
       WHERE session_id=$1`,
      [owner.sessionId, ATTEMPT_NOW]
    );
    await assert.rejects(
      service.listOwnedInProgress(owner, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );
  } finally {
    await db.close();
  }
});
