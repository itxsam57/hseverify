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

const runtime = process.env.HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST is required");

const recoveryModule = await import(
  pathToFileURL(
    join(runtime, "assessment-attempt", "assessment-attempt-recovery-service.js")
  ).href
);
const attemptModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);
const attemptDomainModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-domain.js")).href
);

const { AssessmentAttemptRecoveryService } = recoveryModule;
const { AssessmentAttemptService } = attemptModule;
const { AssessmentAttemptAccessError, AssessmentAttemptConflictError } =
  attemptDomainModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-attempt-interruption-runtime",
  sessionSecret: "m2-08-attempt-interruption-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-attempt-interruption-auth-pepper-more-than-thirty-two-characters",
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

async function attemptState(db, attemptId) {
  const result = await db.query(
    `SELECT status,current_position,form_id,submitted_at
     FROM assessment_attempts
     WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0];
}

async function draftRow(db, attemptId) {
  const result = await db.query(
    `SELECT attempt_id,form_id,form_item_id,position,question_version_id,
            question_type,text_value,boolean_value,revision
     FROM assessment_attempt_drafts
     WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

function interruptionInput(fixture, item, seed) {
  return {
    attemptId: fixture.attemptId,
    position: item.position,
    questionVersionId: item.questionVersionId,
    reason: "EMERGENCY_EXIT",
    mutationKey: `m2-08-interruption-${seed}-0001`
  };
}

async function saveDraft(db, principal, fixture, item, value, seed) {
  return new AssessmentAttemptRecoveryService(db).saveDraft(
    principal,
    {
      attemptId: fixture.attemptId,
      position: item.position,
      questionVersionId: item.questionVersionId,
      value,
      expectedRevision: null,
      mutationKey: `m2-08-lifecycle-draft-${seed}-0001`
    },
    ATTEMPT_NOW_DATE
  );
}

async function countLifecycleEvidence(db, fixture, action, eventType) {
  return {
    audit: await countRows(
      db,
      "platform_audit_events",
      "action_key=$1 AND target_reference=$2",
      [action, fixture.attemptId]
    ),
    timeline: await countRows(
      db,
      "assurance_case_timeline_events",
      "case_id=$1 AND event_type=$2",
      [fixture.caseId, eventType]
    )
  };
}

test("M2.08 Emergency Exit is idempotent and same-form recovery preserves immutable progress and the server draft", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "lifecycle-happy");
    const fixture = await seedInProgressAttempt(db, principal, "lifecycle-happy", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] },
      { questionType: "SHORT_TEXT" }
    ]);
    const [first, second] = fixture.items;
    const attemptService = new AssessmentAttemptService(db);
    const recoveryService = new AssessmentAttemptRecoveryService(db);

    await attemptService.submitCurrentAnswer(
      principal,
      {
        attemptId: fixture.attemptId,
        position: first.position,
        questionVersionId: first.questionVersionId,
        answer: "Alpha"
      },
      ATTEMPT_NOW_DATE
    );
    const saved = await saveDraft(
      db,
      principal,
      fixture,
      second,
      "  unsent recovery draft  ",
      "happy"
    );
    assert.equal(saved.revision, 1);

    const request = interruptionInput(fixture, second, "happy");
    const interrupted = await recoveryService.interrupt(
      principal,
      request,
      ATTEMPT_NOW_DATE
    );
    assert.equal(interrupted.attemptId, fixture.attemptId);
    assert.equal(interrupted.status, "INTERRUPTED");
    assert.equal(interrupted.currentPosition, 2);
    assert.equal("draft" in interrupted, false);
    assert.equal("value" in interrupted, false);

    const retry = await recoveryService.interrupt(
      principal,
      request,
      new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
    );
    assert.equal(retry.status, "INTERRUPTED");
    assert.equal(
      await countRows(
        db,
        "assessment_attempt_interruptions",
        "attempt_id=$1 AND mutation_key=$2",
        [fixture.attemptId, request.mutationKey]
      ),
      1
    );
    assert.deepEqual(
      await countLifecycleEvidence(
        db,
        fixture,
        "assessment.attempt.interrupted",
        "assessment_attempt_interrupted"
      ),
      { audit: 1, timeline: 1 }
    );

    await assert.rejects(
      saveDraft(db, principal, fixture, second, "blocked while interrupted", "blocked"),
      AssessmentAttemptConflictError
    );
    await assert.rejects(
      attemptService.submitCurrentAnswer(
        principal,
        {
          attemptId: fixture.attemptId,
          position: second.position,
          questionVersionId: second.questionVersionId,
          answer: "Valid but blocked while interrupted"
        },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );

    const eligible = await recoveryService.establishRecoveryEligibility(
      principal,
      { attemptId: fixture.attemptId },
      ATTEMPT_NOW_DATE
    );
    assert.equal(eligible.status, "RECOVERABLE");
    assert.equal(eligible.currentPosition, 2);
    assert.equal("draft" in eligible, false);
    assert.deepEqual(
      await countLifecycleEvidence(
        db,
        fixture,
        "assessment.attempt.recovery.eligible",
        "assessment_attempt_recovery_eligible"
      ),
      { audit: 1, timeline: 1 }
    );

    const resumed = await recoveryService.resumeSameForm(
      principal,
      { attemptId: fixture.attemptId },
      ATTEMPT_NOW_DATE
    );
    assert.equal(resumed.attempt.attemptId, fixture.attemptId);
    assert.equal(resumed.attempt.formId, fixture.formId);
    assert.equal(resumed.attempt.status, "IN_PROGRESS");
    assert.equal(resumed.attempt.currentPosition, 2);
    assert.equal(resumed.currentQuestion.position, 2);
    assert.equal(resumed.currentQuestion.questionVersionId, second.questionVersionId);
    assert.deepEqual(
      await countLifecycleEvidence(
        db,
        fixture,
        "assessment.attempt.resumed",
        "assessment_attempt_resumed"
      ),
      { audit: 1, timeline: 1 }
    );

    const persistedDraft = await draftRow(db, fixture.attemptId);
    assert.ok(persistedDraft);
    assert.equal(persistedDraft.form_id, fixture.formId);
    assert.equal(Number(persistedDraft.position), 2);
    assert.equal(persistedDraft.question_version_id, second.questionVersionId);
    assert.equal(persistedDraft.text_value, "  unsent recovery draft  ");
    assert.equal(Number(persistedDraft.revision), 1);
    assert.equal(
      await countRows(
        db,
        "assessment_attempt_answers",
        "attempt_id=$1 AND position=1",
        [fixture.attemptId]
      ),
      1
    );

    const caseState = await db.query(
      `SELECT case_status,assessment_reference
       FROM assurance_cases
       WHERE case_id=$1`,
      [fixture.caseId]
    );
    assert.equal(caseState.rows[0].case_status, "Assessment in progress");
    assert.equal(caseState.rows[0].assessment_reference, fixture.attemptId);

    const evidence = await db.query(
      `SELECT action_key,metadata
       FROM platform_audit_events
       WHERE target_reference=$1
         AND action_key IN (
           'assessment.attempt.interrupted',
           'assessment.attempt.recovery.eligible',
           'assessment.attempt.resumed'
         )`,
      [fixture.attemptId]
    );
    assert.equal(JSON.stringify(evidence.rows).includes("unsent recovery draft"), false);
  } finally {
    await db.close();
  }
});

test("M2.08 ordinary IN_PROGRESS reload does not fabricate an interruption or recovery transition", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "lifecycle-reload");
    const fixture = await seedInProgressAttempt(db, principal, "lifecycle-reload", [
      { questionType: "TRUE_FALSE" }
    ]);

    const view = await new AssessmentAttemptService(db).getOwnedView(
      principal,
      fixture.attemptId,
      ATTEMPT_NOW_DATE
    );
    assert.equal(view.attempt.status, "IN_PROGRESS");
    assert.equal(view.currentQuestion.position, 1);
    assert.equal(
      await countRows(db, "assessment_attempt_interruptions", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    assert.equal(
      await countRows(
        db,
        "platform_audit_events",
        "target_reference=$1 AND action_key IN ('assessment.attempt.interrupted','assessment.attempt.recovery.eligible','assessment.attempt.resumed')",
        [fixture.attemptId]
      ),
      0
    );
  } finally {
    await db.close();
  }
});

test("M2.08 lifecycle transitions fail closed for another Worker, a non-Worker principal, and a revoked session", async () => {
  const db = await database();
  try {
    const owner = await seedWorkerPrincipal(db, "lifecycle-owner");
    const other = await seedWorkerPrincipal(db, "lifecycle-other");
    const fixture = await seedInProgressAttempt(db, owner, "lifecycle-owner", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);
    const request = interruptionInput(fixture, item, "auth");

    await assert.rejects(
      service.interrupt(other, request, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );
    await assert.rejects(
      service.interrupt(
        { ...owner, activeRole: "company" },
        request,
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptAccessError
    );

    await db.query(
      `UPDATE auth_sessions
       SET revoked_at=$2,revocation_reason='m2_08_lifecycle_test'
       WHERE session_id=$1`,
      [owner.sessionId, ATTEMPT_NOW_DATE.toISOString()]
    );
    await assert.rejects(
      service.interrupt(owner, request, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );

    assert.equal((await attemptState(db, fixture.attemptId)).status, "IN_PROGRESS");
    assert.equal(
      await countRows(db, "assessment_attempt_interruptions", "attempt_id=$1", [fixture.attemptId]),
      0
    );
  } finally {
    await db.close();
  }
});

test("M2.08 SUBMITTED remains terminal for interrupt, eligibility, and same-form resume", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "lifecycle-submitted");
    const fixture = await seedInProgressAttempt(db, principal, "lifecycle-submitted", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    await new AssessmentAttemptService(db).submitCurrentAnswer(
      principal,
      {
        attemptId: fixture.attemptId,
        position: 1,
        questionVersionId: item.questionVersionId,
        answer: true
      },
      ATTEMPT_NOW_DATE
    );

    const service = new AssessmentAttemptRecoveryService(db);
    await assert.rejects(
      service.interrupt(
        principal,
        interruptionInput(fixture, item, "submitted"),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    await assert.rejects(
      service.establishRecoveryEligibility(
        principal,
        { attemptId: fixture.attemptId },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    await assert.rejects(
      service.resumeSameForm(
        principal,
        { attemptId: fixture.attemptId },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );

    const state = await attemptState(db, fixture.attemptId);
    assert.equal(state.status, "SUBMITTED");
    assert.ok(state.submitted_at);
    assert.equal(
      await countRows(db, "assessment_attempt_interruptions", "attempt_id=$1", [fixture.attemptId]),
      0
    );
  } finally {
    await db.close();
  }
});

test("M2.08 concurrent interrupt versus commit serializes to exactly one valid outcome", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "lifecycle-race");
    const fixture = await seedInProgressAttempt(db, principal, "lifecycle-race", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const recoveryService = new AssessmentAttemptRecoveryService(db);
    const attemptService = new AssessmentAttemptService(db);

    const results = await Promise.allSettled([
      recoveryService.interrupt(
        principal,
        interruptionInput(fixture, item, "race"),
        ATTEMPT_NOW_DATE
      ),
      attemptService.submitCurrentAnswer(
        principal,
        {
          attemptId: fixture.attemptId,
          position: 1,
          questionVersionId: item.questionVersionId,
          answer: true
        },
        ATTEMPT_NOW_DATE
      )
    ]);

    const fulfilled = results.filter((entry) => entry.status === "fulfilled");
    const rejected = results.filter((entry) => entry.status === "rejected");
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.ok(rejected[0].reason instanceof AssessmentAttemptConflictError);

    const state = await attemptState(db, fixture.attemptId);
    const interruptionCount = await countRows(
      db,
      "assessment_attempt_interruptions",
      "attempt_id=$1",
      [fixture.attemptId]
    );
    const answerCount = await countRows(
      db,
      "assessment_attempt_answers",
      "attempt_id=$1",
      [fixture.attemptId]
    );

    if (state.status === "INTERRUPTED") {
      assert.equal(interruptionCount, 1);
      assert.equal(answerCount, 0);
      assert.equal(state.submitted_at, null);
    } else {
      assert.equal(state.status, "SUBMITTED");
      assert.equal(interruptionCount, 0);
      assert.equal(answerCount, 1);
      assert.ok(state.submitted_at);
    }
  } finally {
    await db.close();
  }
});
