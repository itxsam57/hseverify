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
const serviceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);
const domainModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-domain.js")).href
);
const {
  AssessmentAttemptService,
  AssessmentAttemptConflictError
} = serviceModule;
const { AssessmentAttemptAnswerInputError } = domainModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-task5-draft-commit-runtime",
  sessionSecret: "m2-08-task5-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-task5-auth-pepper-more-than-thirty-two-characters",
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

async function attemptState(db, attemptId) {
  const result = await db.query(
    `SELECT status,current_position,submitted_at
     FROM assessment_attempts WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0];
}

async function draftState(db, attemptId) {
  const result = await db.query(
    `SELECT form_item_id,position,text_value,boolean_value,revision
     FROM assessment_attempt_drafts WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

async function answerState(db, attemptId, position) {
  const result = await db.query(
    `SELECT question_type,text_value,boolean_value,numeric_value
     FROM assessment_attempt_answers
     WHERE attempt_id=$1 AND position=$2`,
    [attemptId, position]
  );
  return result.rows[0] ?? null;
}

async function saveDraft(service, principal, fixture, itemIndex, value, mutationKey) {
  const item = fixture.items[itemIndex];
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

async function submit(service, principal, fixture, itemIndex, answer) {
  const item = fixture.items[itemIndex];
  return service.submitCurrentAnswer(
    principal,
    {
      attemptId: fixture.attemptId,
      position: item.position,
      questionVersionId: item.questionVersionId,
      answer
    },
    ATTEMPT_NOW_DATE
  );
}

test("invalid committed answer leaves the acknowledged draft and attempt position unchanged", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-invalid");
    const fixture = await seedInProgressAttempt(db, principal, "task5-invalid", [
      { questionType: "SHORT_TEXT" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "  recover me exactly  ", "task5-invalid-draft");

    await assert.rejects(
      submit(service, principal, fixture, 0, ""),
      AssessmentAttemptAnswerInputError
    );

    const draft = await draftState(db, fixture.attemptId);
    assert.ok(draft);
    assert.equal(draft.text_value, "  recover me exactly  ");
    assert.equal(Number(draft.revision), 1);
    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(attempt.status, "IN_PROGRESS");
    assert.equal(Number(attempt.current_position), 1);
  } finally {
    await db.close();
  }
});

test("successful Next atomically commits the answer, deletes the matching draft, then advances", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-next");
    const fixture = await seedInProgressAttempt(db, principal, "task5-next", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "Alpha", "task5-next-draft");

    const view = await submit(service, principal, fixture, 0, "Bravo");

    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1 AND position=1", [fixture.attemptId]), 1);
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
    const answer = await answerState(db, fixture.attemptId, 1);
    assert.equal(answer.text_value, "Bravo");
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(attempt.status, "IN_PROGRESS");
    assert.equal(Number(attempt.current_position), 2);
    assert.equal(view.currentQuestion.position, 2);
    assert.equal(view.currentDraft, null);
  } finally {
    await db.close();
  }
});

test("successful final Submit assessment deletes the final draft and marks the attempt submitted", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-final");
    const fixture = await seedInProgressAttempt(db, principal, "task5-final", [
      { questionType: "SHORT_TEXT" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "unfinished final", "task5-final-draft");

    const view = await submit(service, principal, fixture, 0, "Final committed response");

    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 1);
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(attempt.status, "SUBMITTED");
    assert.ok(attempt.submitted_at);
    assert.equal(view.submitted, true);
    assert.equal(view.currentDraft, null);
  } finally {
    await db.close();
  }
});

test("the explicit submitted answer is commit authority even when an older draft differs", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-explicit");
    const fixture = await seedInProgressAttempt(db, principal, "task5-explicit", [
      { questionType: "SHORT_TEXT" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "older draft response", "task5-explicit-draft");

    await submit(service, principal, fixture, 0, "new explicit committed response");

    const answer = await answerState(db, fixture.attemptId, 1);
    assert.equal(answer.text_value, "new explicit committed response");
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
  } finally {
    await db.close();
  }
});

test("failed committed-answer insert leaves the draft and position unchanged", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-insert-failure");
    const fixture = await seedInProgressAttempt(db, principal, "task5-insert-failure", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "keep after insert failure", "task5-insert-failure-draft");
    await db.execute(`
      CREATE OR REPLACE FUNCTION m208_task5_reject_answer_insert()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'forced Task 5 answer insert failure';
      END; $$;
      CREATE TRIGGER m208_task5_reject_answer_insert_trigger
      BEFORE INSERT ON assessment_attempt_answers
      FOR EACH ROW EXECUTE FUNCTION m208_task5_reject_answer_insert();
    `);

    await assert.rejects(
      submit(service, principal, fixture, 0, "valid committed response"),
      /forced Task 5 answer insert failure/
    );

    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
    assert.ok(await draftState(db, fixture.attemptId));
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(Number(attempt.current_position), 1);
    assert.equal(attempt.status, "IN_PROGRESS");
  } finally {
    await db.close();
  }
});

test("forced draft-delete failure rolls back committed answer and progression", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-delete-failure");
    const fixture = await seedInProgressAttempt(db, principal, "task5-delete-failure", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "must survive delete failure", "task5-delete-failure-draft");
    await db.execute(`
      CREATE OR REPLACE FUNCTION m208_task5_reject_draft_delete()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'forced Task 5 draft delete failure';
      END; $$;
      CREATE TRIGGER m208_task5_reject_draft_delete_trigger
      BEFORE DELETE ON assessment_attempt_drafts
      FOR EACH ROW EXECUTE FUNCTION m208_task5_reject_draft_delete();
    `);

    await assert.rejects(
      submit(service, principal, fixture, 0, "valid committed response"),
      /forced Task 5 draft delete failure/
    );

    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
    assert.ok(await draftState(db, fixture.attemptId));
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(Number(attempt.current_position), 1);
    assert.equal(attempt.status, "IN_PROGRESS");
  } finally {
    await db.close();
  }
});

test("forced progression failure rolls back the answer and draft deletion together", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-progression-failure");
    const fixture = await seedInProgressAttempt(db, principal, "task5-progression-failure", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "must survive progression failure", "task5-progression-failure-draft");
    await db.execute(`
      CREATE OR REPLACE FUNCTION m208_task5_reject_progression()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.current_position <> OLD.current_position THEN
          RAISE EXCEPTION 'forced Task 5 progression failure';
        END IF;
        RETURN NEW;
      END; $$;
      CREATE TRIGGER m208_task5_reject_progression_trigger
      BEFORE UPDATE ON assessment_attempts
      FOR EACH ROW EXECUTE FUNCTION m208_task5_reject_progression();
    `);

    await assert.rejects(
      submit(service, principal, fixture, 0, "valid committed response"),
      /forced Task 5 progression failure/
    );

    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
    const draft = await draftState(db, fixture.attemptId);
    assert.ok(draft);
    assert.equal(draft.text_value, "must survive progression failure");
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(Number(attempt.current_position), 1);
  } finally {
    await db.close();
  }
});

test("stale autosave from the prior position cannot recreate an old draft after commit", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-stale-save");
    const fixture = await seedInProgressAttempt(db, principal, "task5-stale-save", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);
    const first = fixture.items[0];
    await saveDraft(service, principal, fixture, 0, "old position draft", "task5-stale-save-draft");
    await submit(service, principal, fixture, 0, "committed first response");

    await assert.rejects(
      service.saveCurrentDraft(
        principal,
        {
          attemptId: fixture.attemptId,
          position: 1,
          questionVersionId: first.questionVersionId,
          value: "late stale browser payload",
          expectedRevision: 1,
          mutationKey: "task5-late-stale-save"
        },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );

    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
    const attempt = await attemptState(db, fixture.attemptId);
    assert.equal(Number(attempt.current_position), 2);
  } finally {
    await db.close();
  }
});

test("exact committed-answer replay stays idempotent and preserves the unrelated current-position draft", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-replay");
    const fixture = await seedInProgressAttempt(db, principal, "task5-replay", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "Alpha", "task5-replay-first-draft");
    await submit(service, principal, fixture, 0, "Bravo");
    await saveDraft(service, principal, fixture, 1, false, "task5-replay-second-draft");

    const replay = await submit(service, principal, fixture, 0, "Bravo");

    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1 AND position=1", [fixture.attemptId]), 1);
    const draft = await draftState(db, fixture.attemptId);
    assert.ok(draft);
    assert.equal(Number(draft.position), 2);
    assert.equal(draft.form_item_id, fixture.items[1].formItemId);
    assert.equal(draft.boolean_value, false);
    assert.equal(replay.currentQuestion.position, 2);
    assert.deepEqual(replay.currentDraft, {
      value: false,
      revision: 1,
      updatedAt: ATTEMPT_NOW_DATE.toISOString()
    });
  } finally {
    await db.close();
  }
});

test("Task 5 never updates or deletes an immutable committed answer", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "task5-append-only");
    const fixture = await seedInProgressAttempt(db, principal, "task5-append-only", [
      { questionType: "SHORT_TEXT" }
    ]);
    const service = new AssessmentAttemptService(db);
    await saveDraft(service, principal, fixture, 0, "temporary draft", "task5-append-only-draft");
    await submit(service, principal, fixture, 0, "immutable committed response");

    const appendOnlyError = (error) => /append-only/i.test(String(error?.message ?? error));
    await assert.rejects(
      db.query(
        `UPDATE assessment_attempt_answers
         SET text_value='mutated' WHERE attempt_id=$1 AND position=1`,
        [fixture.attemptId]
      ),
      appendOnlyError
    );
    await assert.rejects(
      db.query(
        `DELETE FROM assessment_attempt_answers
         WHERE attempt_id=$1 AND position=1`,
        [fixture.attemptId]
      ),
      appendOnlyError
    );

    const answer = await answerState(db, fixture.attemptId, 1);
    assert.equal(answer.text_value, "immutable committed response");
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
  } finally {
    await db.close();
  }
});
