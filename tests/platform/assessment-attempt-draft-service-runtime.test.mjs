import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW,
  ATTEMPT_NOW_DATE,
  countRows,
  seedInProgressAttempt,
  seedWorkerPrincipal,
  stableId
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_ATTEMPT_RUNTIME_DIST is required");
const serviceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);
const draftDomainModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-draft-domain.js")).href
);
const {
  AssessmentAttemptService,
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError
} = serviceModule;
const { AssessmentAttemptDraftInputError } = draftDomainModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-service-runtime",
  sessionSecret: "m2-08-draft-service-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-service-auth-pepper-more-than-thirty-two-characters",
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

async function storedDraft(db, attemptId) {
  const result = await db.query(
    `SELECT attempt_id,form_id,form_item_id,position,question_id,question_version_id,
            question_type,text_value,boolean_value,revision,latest_mutation_key,
            latest_mutation_digest
     FROM assessment_attempt_drafts
     WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

async function setup(db, seed, questions = [{ questionType: "SHORT_TEXT" }]) {
  const worker = await seedWorkerPrincipal(db, seed);
  const fixture = await seedInProgressAttempt(db, worker, seed, questions);
  return { worker, fixture, service: new AssessmentAttemptService(db) };
}

function saveInput(fixture, overrides = {}) {
  return {
    attemptId: fixture.attemptId,
    position: 1,
    questionVersionId: fixture.items[0].questionVersionId,
    value: "  exact draft text  ",
    expectedRevision: null,
    mutationKey: `draft-service-${fixture.attemptId.slice(-12)}-1`,
    ...overrides
  };
}

function safeSnapshot(snapshot) {
  assert.ok(snapshot);
  const json = JSON.stringify(snapshot).toLowerCase();
  assert.equal(json.includes("mutation"), false);
  assert.equal(json.includes("digest"), false);
  assert.equal(json.includes("formitem"), false);
  assert.equal(json.includes("questionid"), false);
}

test("owning live Worker saves only the authoritative current item and client lineage extras are ignored", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-service-owner");
    const beforeAudit = await countRows(db, "platform_audit_events");
    const beforeTimeline = await countRows(db, "assurance_case_timeline_events");

    const snapshot = await service.saveCurrentDraft(
      worker,
      {
        ...saveInput(fixture),
        formId: "assessment_form_client_supplied_should_be_ignored",
        formItemId: "assessment_form_item_client_supplied_should_be_ignored",
        questionId: "assessment_question_client_supplied_should_be_ignored"
      },
      ATTEMPT_NOW_DATE
    );

    safeSnapshot(snapshot);
    assert.equal(snapshot.value, "  exact draft text  ");
    assert.equal(snapshot.revision, 1);

    const row = await storedDraft(db, fixture.attemptId);
    assert.ok(row);
    assert.equal(row.form_id, fixture.formId);
    assert.equal(row.form_item_id, fixture.items[0].formItemId);
    assert.equal(Number(row.position), 1);
    assert.equal(row.question_id, fixture.items[0].questionId);
    assert.equal(row.question_version_id, fixture.items[0].questionVersionId);
    assert.equal(row.question_type, "SHORT_TEXT");
    assert.equal(row.text_value, "  exact draft text  ");
    assert.match(String(row.latest_mutation_digest), /^[0-9a-f]{64}$/);

    assert.equal(await countRows(db, "platform_audit_events"), beforeAudit);
    assert.equal(await countRows(db, "assurance_case_timeline_events"), beforeTimeline);
  } finally {
    await db.close();
  }
});

test("another Worker, non-Worker roles, revoked session, and expired session fail closed", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-service-auth-owner");
    const other = await seedWorkerPrincipal(db, "draft-service-auth-other");

    await assert.rejects(
      service.saveCurrentDraft(other, saveInput(fixture), ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );

    for (const role of ["root", "admin", "verifier", "company"]) {
      await assert.rejects(
        service.saveCurrentDraft(
          { ...worker, activeRole: role },
          saveInput(fixture),
          ATTEMPT_NOW_DATE
        ),
        AssessmentAttemptAccessError
      );
    }

    await db.query(
      `UPDATE auth_sessions
       SET revoked_at=$2,revocation_reason='m208_draft_revoked'
       WHERE session_id=$1`,
      [worker.sessionId, ATTEMPT_NOW]
    );
    await assert.rejects(
      service.saveCurrentDraft(worker, saveInput(fixture), ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );

    await db.query(
      `UPDATE auth_sessions
       SET revoked_at=NULL,revocation_reason=NULL,expires_at='2026-08-31T20:09:00.000Z'
       WHERE session_id=$1`,
      [worker.sessionId]
    );
    await assert.rejects(
      service.saveCurrentDraft(worker, saveInput(fixture), ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );

    assert.equal(await storedDraft(db, fixture.attemptId), null);
  } finally {
    await db.close();
  }
});

test("submitted attempt and stale position or question version fail conflict without creating a draft", async () => {
  const db = await database();
  try {
    const submitted = await setup(db, "draft-service-submitted");
    await submitted.service.submitCurrentAnswer(
      submitted.worker,
      {
        attemptId: submitted.fixture.attemptId,
        position: 1,
        questionVersionId: submitted.fixture.items[0].questionVersionId,
        answer: "Committed final response"
      },
      ATTEMPT_NOW_DATE
    );
    await assert.rejects(
      submitted.service.saveCurrentDraft(
        submitted.worker,
        saveInput(submitted.fixture),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    assert.equal(await storedDraft(db, submitted.fixture.attemptId), null);

    const stale = await setup(db, "draft-service-stale", [
      { questionType: "SHORT_TEXT" },
      { questionType: "SHORT_TEXT" }
    ]);
    await assert.rejects(
      stale.service.saveCurrentDraft(
        stale.worker,
        saveInput(stale.fixture, { position: 2 }),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    await assert.rejects(
      stale.service.saveCurrentDraft(
        stale.worker,
        saveInput(stale.fixture, {
          questionVersionId: stableId("question_version", "draft-service-stale-version")
        }),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    assert.equal(await storedDraft(db, stale.fixture.attemptId), null);
  } finally {
    await db.close();
  }
});

test("an already committed current position cannot receive a mutable draft", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-service-committed-current");
    const item = fixture.items[0];
    await db.query(
      `INSERT INTO assessment_attempt_answers(
         answer_id,attempt_id,form_id,form_item_id,position,question_id,question_version_id,
         question_type,text_value,boolean_value,numeric_value,committed_at
       ) VALUES($1,$2,$3,$4,1,$5,$6,'SHORT_TEXT',$7,NULL,NULL,$8)`,
      [
        stableId("assessment_answer", "draft-service-committed-current"),
        fixture.attemptId,
        fixture.formId,
        item.formItemId,
        item.questionId,
        item.questionVersionId,
        "Already committed",
        ATTEMPT_NOW
      ]
    );

    await assert.rejects(
      service.saveCurrentDraft(worker, saveInput(fixture), ATTEMPT_NOW_DATE),
      AssessmentAttemptConflictError
    );
    assert.equal(await storedDraft(db, fixture.attemptId), null);
  } finally {
    await db.close();
  }
});

test("pinned type/options validate draft shape and errors never echo the submitted draft value", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-service-validation", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] }
    ]);
    const secretDraft = "SECRET-DRAFT-VALUE-MUST-NOT-LEAK";

    let caught = null;
    try {
      await service.saveCurrentDraft(
        worker,
        saveInput(fixture, { value: secretDraft }),
        ATTEMPT_NOW_DATE
      );
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof AssessmentAttemptDraftInputError);
    assert.equal(String(caught.message).includes(secretDraft), false);
    assert.equal(await storedDraft(db, fixture.attemptId), null);
  } finally {
    await db.close();
  }
});

test("service preserves repository CAS semantics for exact retry, stale revision, and mutation-key misuse", async () => {
  const db = await database();
  try {
    const { worker, fixture, service } = await setup(db, "draft-service-cas");
    const firstInput = saveInput(fixture, {
      value: "first value",
      mutationKey: "draft-service-cas-key-1"
    });
    const first = await service.saveCurrentDraft(worker, firstInput, ATTEMPT_NOW_DATE);
    assert.equal(first.revision, 1);

    const secondInput = saveInput(fixture, {
      value: "second value",
      expectedRevision: 1,
      mutationKey: "draft-service-cas-key-2"
    });
    const second = await service.saveCurrentDraft(worker, secondInput, ATTEMPT_NOW_DATE);
    assert.equal(second.revision, 2);
    assert.equal(second.value, "second value");

    const retry = await service.saveCurrentDraft(worker, secondInput, ATTEMPT_NOW_DATE);
    assert.equal(retry.revision, 2);
    assert.equal(retry.value, "second value");

    await assert.rejects(
      service.saveCurrentDraft(
        worker,
        { ...secondInput, value: "changed under reused key", expectedRevision: 2 },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    await assert.rejects(
      service.saveCurrentDraft(
        worker,
        saveInput(fixture, {
          value: "stale",
          expectedRevision: 1,
          mutationKey: "draft-service-cas-key-3"
        }),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );

    const row = await storedDraft(db, fixture.attemptId);
    assert.equal(Number(row.revision), 2);
    assert.equal(row.text_value, "second value");
  } finally {
    await db.close();
  }
});
