import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

const runtime = process.env.HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST is required");
const attemptServiceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);
const recoveryServiceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-recovery-service.js")).href
);
const attemptDomain = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-domain.js")).href
);
const { AssessmentAttemptService } = attemptServiceModule;
const { AssessmentAttemptRecoveryService } = recoveryServiceModule;
const { AssessmentAttemptAnswerInputError, AssessmentAttemptConflictError } = attemptDomain;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-recovery-commit-runtime",
  sessionSecret: "m2-08-recovery-commit-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-recovery-commit-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_recovery");
  return db;
}

function commitInput(fixture, item, answer) {
  return {
    attemptId: fixture.attemptId,
    position: item.position,
    questionVersionId: item.questionVersionId,
    answer
  };
}

function draftInput(fixture, item, value, mutationKey, expectedRevision = null) {
  return {
    attemptId: fixture.attemptId,
    position: item.position,
    questionVersionId: item.questionVersionId,
    value,
    expectedRevision,
    mutationKey
  };
}

async function attemptState(db, attemptId) {
  const result = await db.query(
    `SELECT status,current_position,submitted_at
     FROM assessment_attempts WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0];
}

async function saveDraft(db, principal, fixture, item, value, suffix = "one") {
  return new AssessmentAttemptRecoveryService(db).saveDraft(
    principal,
    draftInput(fixture, item, value, `mutation-commit-${suffix}-0001`, null),
    ATTEMPT_NOW_DATE
  );
}

async function createRecoverySuccessor(db, principal, fixture, seed) {
  const frameworkResult = await db.query(
    `SELECT framework_id FROM assessment_blueprint_versions WHERE blueprint_version_id=$1`,
    [fixture.blueprintVersionId]
  );
  const frameworkId = frameworkResult.rows[0]?.framework_id;
  assert.ok(frameworkId);

  const questionId = stableId("assessment_question", `${seed}:successor-question`);
  const questionVersionId = stableId("question_version", `${seed}:successor-question`);
  const formId = stableId("assessment_form", `${seed}:successor-form`);
  const formItemId = stableId("assessment_form_item", `${seed}:successor-item`);
  const attemptId = stableId("assessment_attempt", `${seed}:successor-attempt`);
  const recoveryId = stableId("assessment_recovery", `${seed}:successor-lineage`);
  const fingerprint = digest(`${seed}:successor-question`);

  await db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO assessment_questions(
         question_id,question_reference,question_status,current_version_id,current_content_fingerprint,
         created_by_account_id,created_at,updated_at
       ) VALUES($1,$2,'INACTIVE',NULL,NULL,$3,$4,$4)`,
      [
        questionId,
        `M208-COMMIT-${digest(seed).slice(0, 10).toUpperCase()}`,
        principal.accountId,
        ATTEMPT_NOW
      ]
    );
    await tx.query(
      `INSERT INTO assessment_question_versions(
         question_version_id,question_id,version_no,question_type,prompt,options_json,
         answer_key_json,rubric_json,framework_id,domain_reference,difficulty,tags_json,
         content_fingerprint,created_by_account_id,created_at
       ) VALUES($1,$2,1,'TRUE_FALSE',$3,NULL,'true'::jsonb,NULL,$4,'Core','MEDIUM','[]'::jsonb,$5,$6,$7)`,
      [
        questionVersionId,
        questionId,
        `M2.08 commit successor fixture ${seed}.`,
        frameworkId,
        fingerprint,
        principal.accountId,
        ATTEMPT_NOW
      ]
    );
    await tx.query(
      `UPDATE assessment_questions
       SET current_version_id=$2,current_content_fingerprint=$3,question_status='ACTIVE',updated_at=$4
       WHERE question_id=$1`,
      [questionId, questionVersionId, fingerprint, ATTEMPT_NOW]
    );
    await tx.query(
      `INSERT INTO generated_assessment_forms(
         form_id,case_id,worker_account_id,blueprint_version_id,generation_nonce_hex,
         question_count,generated_at,recovery_source_attempt_id
       ) VALUES($1,$2,$3,$4,$5,1,$6,$7)`,
      [
        formId,
        fixture.caseId,
        principal.accountId,
        fixture.blueprintVersionId,
        digest(`${seed}:successor-nonce`),
        ATTEMPT_NOW,
        fixture.attemptId
      ]
    );
    await tx.query(
      `INSERT INTO generated_assessment_form_items(
         form_item_id,form_id,position,question_id,question_version_id,created_at
       ) VALUES($1,$2,1,$3,$4,$5)`,
      [formItemId, formId, questionId, questionVersionId, ATTEMPT_NOW]
    );
    await tx.query(
      `INSERT INTO assessment_attempts(
         attempt_id,case_id,worker_account_id,catalogue_version_id,blueprint_version_id,
         form_id,status,current_position,question_count,started_at,submitted_at,created_at,updated_at
       ) VALUES($1,$2,$3,$4,$5,$6,'RECOVERABLE',1,1,$7,NULL,$7,$7)`,
      [
        attemptId,
        fixture.caseId,
        principal.accountId,
        fixture.catalogueVersionId,
        fixture.blueprintVersionId,
        formId,
        ATTEMPT_NOW
      ]
    );
    await tx.query(
      `INSERT INTO assessment_attempt_recovery_lineage(
         recovery_id,predecessor_attempt_id,successor_attempt_id,case_id,worker_account_id,
         catalogue_version_id,blueprint_version_id,reason,created_at
       ) VALUES($1,$2,$3,$4,$5,$6,$7,'SERVER_RECOVERY_REQUIRED',$8)`,
      [
        recoveryId,
        fixture.attemptId,
        attemptId,
        fixture.caseId,
        principal.accountId,
        fixture.catalogueVersionId,
        fixture.blueprintVersionId,
        ATTEMPT_NOW
      ]
    );
  });
}

test("M2.08 invalid explicit commit leaves the server draft and position unchanged", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "commit-invalid");
    const fixture = await seedInProgressAttempt(db, principal, "commit-invalid", [
      { questionType: "INTEGER" }
    ]);
    const item = fixture.items[0];
    await saveDraft(db, principal, fixture, item, "-", "invalid");

    await assert.rejects(
      new AssessmentAttemptService(db).submitCurrentAnswer(
        principal,
        commitInput(fixture, item, "-"),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptAnswerInputError
    );

    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 1);
    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
    const state = await attemptState(db, fixture.attemptId);
    assert.equal(state.status, "IN_PROGRESS");
    assert.equal(Number(state.current_position), 1);
  } finally {
    await db.close();
  }
});

test("M2.08 valid non-final commit inserts once, deletes the matching draft, then advances", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "commit-next");
    const fixture = await seedInProgressAttempt(db, principal, "commit-next", [
      { questionType: "SHORT_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    await saveDraft(db, principal, fixture, item, "  draft exact  ", "next");

    const view = await new AssessmentAttemptService(db).submitCurrentAnswer(
      principal,
      commitInput(fixture, item, "  final answer  "),
      ATTEMPT_NOW_DATE
    );

    assert.equal(view.submitted, false);
    assert.equal(view.currentQuestion.position, 2);
    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1 AND position=1", [fixture.attemptId]), 1);
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
  } finally {
    await db.close();
  }
});

test("M2.08 valid final commit inserts the answer, deletes the draft, then submits", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "commit-final");
    const fixture = await seedInProgressAttempt(db, principal, "commit-final", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    await saveDraft(db, principal, fixture, item, false, "final");

    const view = await new AssessmentAttemptService(db).submitCurrentAnswer(
      principal,
      commitInput(fixture, item, false),
      ATTEMPT_NOW_DATE
    );

    assert.equal(view.submitted, true);
    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 1);
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
    assert.equal((await attemptState(db, fixture.attemptId)).status, "SUBMITTED");
  } finally {
    await db.close();
  }
});

test("M2.08 answer insert, draft delete, and progression failures roll back the whole commit transaction", async () => {
  for (const failure of ["answer", "draft", "progression"]) {
    const db = await database();
    try {
      const seed = `commit-rollback-${failure}`;
      const principal = await seedWorkerPrincipal(db, seed);
      const fixture = await seedInProgressAttempt(db, principal, seed, [
        { questionType: "SHORT_TEXT" },
        { questionType: "TRUE_FALSE" }
      ]);
      const item = fixture.items[0];
      await saveDraft(db, principal, fixture, item, "draft survives rollback", failure);

      if (failure === "answer") {
        await db.execute(`
          CREATE OR REPLACE FUNCTION hse_m208_force_answer_failure()
          RETURNS TRIGGER LANGUAGE plpgsql AS $$
          BEGIN RAISE EXCEPTION 'forced M2.08 answer failure'; END; $$;
          CREATE TRIGGER m208_force_answer_failure
          BEFORE INSERT ON assessment_attempt_answers
          FOR EACH ROW EXECUTE FUNCTION hse_m208_force_answer_failure();
        `);
      } else if (failure === "draft") {
        await db.execute(`
          CREATE OR REPLACE FUNCTION hse_m208_force_draft_delete_failure()
          RETURNS TRIGGER LANGUAGE plpgsql AS $$
          BEGIN RAISE EXCEPTION 'forced M2.08 draft delete failure'; END; $$;
          CREATE TRIGGER m208_force_draft_delete_failure
          BEFORE DELETE ON assessment_attempt_drafts
          FOR EACH ROW EXECUTE FUNCTION hse_m208_force_draft_delete_failure();
        `);
      } else {
        await db.execute(`
          CREATE OR REPLACE FUNCTION hse_m208_force_progression_failure()
          RETURNS TRIGGER LANGUAGE plpgsql AS $$
          BEGIN
            IF NEW.current_position <> OLD.current_position THEN
              RAISE EXCEPTION 'forced M2.08 progression failure';
            END IF;
            RETURN NEW;
          END; $$;
          CREATE TRIGGER m208_force_progression_failure
          BEFORE UPDATE ON assessment_attempts
          FOR EACH ROW EXECUTE FUNCTION hse_m208_force_progression_failure();
        `);
      }

      await assert.rejects(
        new AssessmentAttemptService(db).submitCurrentAnswer(
          principal,
          commitInput(fixture, item, "valid committed response"),
          ATTEMPT_NOW_DATE
        ),
        new RegExp(`forced M2\\.08 ${failure === "draft" ? "draft delete" : failure} failure`, "i")
      );

      assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
      assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 1);
      const state = await attemptState(db, fixture.attemptId);
      assert.equal(state.status, "IN_PROGRESS");
      assert.equal(Number(state.current_position), 1);
    } finally {
      await db.close();
    }
  }
});

test("M2.08 stale tab and superseded predecessor cannot commit", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "commit-stale");
    const fixture = await seedInProgressAttempt(db, principal, "commit-stale", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] },
      { questionType: "TRUE_FALSE" }
    ]);
    const [first] = fixture.items;
    const service = new AssessmentAttemptService(db);
    await service.submitCurrentAnswer(principal, commitInput(fixture, first, "Alpha"), ATTEMPT_NOW_DATE);
    await assert.rejects(
      service.submitCurrentAnswer(principal, commitInput(fixture, first, "Bravo"), ATTEMPT_NOW_DATE),
      AssessmentAttemptConflictError
    );

    const supersededPrincipal = await seedWorkerPrincipal(db, "commit-superseded");
    const superseded = await seedInProgressAttempt(db, supersededPrincipal, "commit-superseded", [
      { questionType: "TRUE_FALSE" }
    ]);
    await createRecoverySuccessor(db, supersededPrincipal, superseded, "commit-superseded");
    await assert.rejects(
      new AssessmentAttemptService(db).submitCurrentAnswer(
        supersededPrincipal,
        commitInput(superseded, superseded.items[0], true),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [superseded.attemptId]), 0);
  } finally {
    await db.close();
  }
});

test("M2.08 identical replay remains idempotent after draft cleanup", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "commit-replay");
    const fixture = await seedInProgressAttempt(db, principal, "commit-replay", [
      { questionType: "MULTIPLE_CHOICE", options: ["Alpha", "Bravo"] },
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    await saveDraft(db, principal, fixture, item, "Alpha", "replay");
    const service = new AssessmentAttemptService(db);

    const first = await service.submitCurrentAnswer(
      principal,
      commitInput(fixture, item, "Alpha"),
      ATTEMPT_NOW_DATE
    );
    const replay = await service.submitCurrentAnswer(
      principal,
      commitInput(fixture, item, "Alpha"),
      new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
    );

    assert.equal(first.currentQuestion.position, 2);
    assert.equal(replay.currentQuestion.position, 2);
    assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 1);
    assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 0);
  } finally {
    await db.close();
  }
});

test("M2.08 incomplete draft-form states stay uncommittable until strict M2.07 normalization accepts them", async () => {
  const cases = [
    { type: "INTEGER", draft: "-", commit: "-" },
    { type: "DECIMAL", draft: ".", commit: "." },
    { type: "DECIMAL", draft: "1.", commit: "1." },
    { type: "SHORT_TEXT", draft: "", commit: "" },
    { type: "LONG_TEXT", draft: "", commit: "" },
    { type: "MULTIPLE_CHOICE", draft: null, commit: null, options: ["Alpha", "Bravo"] },
    { type: "TRUE_FALSE", draft: null, commit: null }
  ];

  for (const [index, entry] of cases.entries()) {
    const db = await database();
    try {
      const seed = `commit-incomplete-${index}`;
      const principal = await seedWorkerPrincipal(db, seed);
      const fixture = await seedInProgressAttempt(db, principal, seed, [
        { questionType: entry.type, ...(entry.options ? { options: entry.options } : {}) }
      ]);
      const item = fixture.items[0];
      await saveDraft(db, principal, fixture, item, entry.draft, `incomplete-${index}`);

      await assert.rejects(
        new AssessmentAttemptService(db).submitCurrentAnswer(
          principal,
          commitInput(fixture, item, entry.commit),
          ATTEMPT_NOW_DATE
        ),
        AssessmentAttemptAnswerInputError
      );
      assert.equal(await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]), 0);
      assert.equal(await countRows(db, "assessment_attempt_drafts", "attempt_id=$1", [fixture.attemptId]), 1);
    } finally {
      await db.close();
    }
  }
});