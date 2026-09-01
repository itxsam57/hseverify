import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW_DATE,
  ATTEMPT_NOW,
  countRows,
  seedInProgressAttempt,
  seedWorkerPrincipal,
  stableId
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_RECOVERY_RUNTIME_DIST is required");
const serviceModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-recovery-service.js")).href
);
const attemptDomain = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-domain.js")).href
);
const recoveryDomain = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-recovery-domain.js")).href
);
const { AssessmentAttemptRecoveryService } = serviceModule;
const { AssessmentAttemptAccessError, AssessmentAttemptConflictError } = attemptDomain;
const { AssessmentDraftConflictError } = recoveryDomain;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-runtime",
  sessionSecret: "m2-08-draft-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-auth-pepper-more-than-thirty-two-characters",
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

function input(fixture, item, value, mutationKey, expectedRevision = null) {
  return {
    attemptId: fixture.attemptId,
    position: item.position,
    questionVersionId: item.questionVersionId,
    value,
    expectedRevision,
    mutationKey
  };
}

async function storedDraft(db, attemptId) {
  const result = await db.query(
    `SELECT position,question_version_id,question_type,text_value,boolean_value,revision,
            latest_mutation_key,latest_mutation_digest,created_at,updated_at
     FROM assessment_attempt_drafts WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

async function storedAttempt(db, attemptId) {
  const result = await db.query(
    `SELECT status,current_position FROM assessment_attempts WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0];
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
        `M208-SUP-${digest(seed).slice(0, 12).toUpperCase()}`,
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
        `M2.08 successor fixture ${seed}.`,
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

test("M2.08 autosave round-trips all six draft types including clear, whitespace, and partial numeric states without committing", async () => {
  const db = await database();
  try {
    const cases = [
      { type: "MULTIPLE_CHOICE", values: ["Bravo", null], options: ["Alpha", "Bravo"] },
      { type: "TRUE_FALSE", values: [false, null] },
      { type: "SHORT_TEXT", values: ["  exact short 😀  ", ""] },
      { type: "LONG_TEXT", values: ["  exact long response  ", ""] },
      { type: "INTEGER", values: ["-", ""] },
      { type: "DECIMAL", values: [".", "1."] }
    ];

    for (const [index, entry] of cases.entries()) {
      const seed = `draft-type-${index}`;
      const principal = await seedWorkerPrincipal(db, seed);
      const fixture = await seedInProgressAttempt(db, principal, seed, [
        { questionType: entry.type, ...(entry.options ? { options: entry.options } : {}) }
      ]);
      const item = fixture.items[0];
      const service = new AssessmentAttemptRecoveryService(db);

      const first = await service.saveDraft(
        principal,
        input(fixture, item, entry.values[0], `mutation-${seed}-first`, null),
        ATTEMPT_NOW_DATE
      );
      assert.equal(first.revision, 1);
      assert.equal(first.value, entry.values[0]);
      assert.equal(first.position, 1);
      assert.equal(first.questionVersionId, item.questionVersionId);
      assert.equal(first.questionType, entry.type);

      const second = await service.saveDraft(
        principal,
        input(fixture, item, entry.values[1], `mutation-${seed}-second`, 1),
        new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
      );
      assert.equal(second.revision, 2);
      assert.equal(second.value, entry.values[1]);

      const row = await storedDraft(db, fixture.attemptId);
      assert.equal(Number(row.revision), 2);
      assert.match(String(row.latest_mutation_digest), /^[a-f0-9]{64}$/);
      assert.equal(
        await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]),
        0
      );
      const attempt = await storedAttempt(db, fixture.attemptId);
      assert.equal(attempt.status, "IN_PROGRESS");
      assert.equal(Number(attempt.current_position), 1);
    }
  } finally {
    await db.close();
  }
});

test("M2.08 autosave fails closed for stale question guards, invalid ownership/session/role, and non-active lifecycle", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-access");
    const other = await seedWorkerPrincipal(db, "draft-access-other");
    const fixture = await seedInProgressAttempt(db, principal, "draft-access", [
      { questionType: "SHORT_TEXT" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);
    const valid = input(fixture, item, "draft", "mutation-draft-access-1", null);

    await assert.rejects(
      service.saveDraft(other, valid, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );
    await assert.rejects(
      service.saveDraft(
        { ...principal, activeRole: "company" },
        valid,
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptAccessError
    );
    await assert.rejects(
      service.saveDraft(
        principal,
        { ...valid, position: 2, mutationKey: "mutation-draft-access-2" },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    await assert.rejects(
      service.saveDraft(
        principal,
        {
          ...valid,
          questionVersionId: "question_version_AAAAAAAAAAAAAAAAAAAAAAAA",
          mutationKey: "mutation-draft-access-3"
        },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );

    await db.query(
      `UPDATE auth_sessions SET revoked_at=$2,revocation_reason='test' WHERE session_id=$1`,
      [principal.sessionId, ATTEMPT_NOW]
    );
    await assert.rejects(
      service.saveDraft(
        principal,
        { ...valid, mutationKey: "mutation-draft-access-4" },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptAccessError
    );

    for (const [statusSeed, transitions] of [
      ["submitted", ["SUBMITTED"]],
      ["interrupted", ["INTERRUPTED"]],
      ["recoverable", ["INTERRUPTED", "RECOVERABLE"]]
    ]) {
      const statePrincipal = await seedWorkerPrincipal(db, `draft-state-${statusSeed}`);
      const stateFixture = await seedInProgressAttempt(db, statePrincipal, `draft-state-${statusSeed}`, [
        { questionType: "TRUE_FALSE" }
      ]);
      for (const transition of transitions) {
        if (transition === "SUBMITTED") {
          await db.query(
            `UPDATE assessment_attempts SET status='SUBMITTED',submitted_at=$2,updated_at=$2 WHERE attempt_id=$1`,
            [stateFixture.attemptId, ATTEMPT_NOW]
          );
        } else {
          await db.query(
            `UPDATE assessment_attempts SET status=$2,updated_at=$3 WHERE attempt_id=$1`,
            [stateFixture.attemptId, transition, ATTEMPT_NOW]
          );
        }
      }
      await assert.rejects(
        service.saveDraft(
          statePrincipal,
          input(
            stateFixture,
            stateFixture.items[0],
            true,
            `mutation-draft-state-${statusSeed}`,
            null
          ),
          ATTEMPT_NOW_DATE
        ),
        AssessmentAttemptConflictError
      );
    }

    const supersededPrincipal = await seedWorkerPrincipal(db, "draft-state-superseded");
    const supersededFixture = await seedInProgressAttempt(
      db,
      supersededPrincipal,
      "draft-state-superseded",
      [{ questionType: "TRUE_FALSE" }]
    );
    await createRecoverySuccessor(
      db,
      supersededPrincipal,
      supersededFixture,
      "draft-state-superseded"
    );
    await assert.rejects(
      service.saveDraft(
        supersededPrincipal,
        input(
          supersededFixture,
          supersededFixture.items[0],
          true,
          "mutation-draft-state-superseded",
          null
        ),
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );

    assert.ok(AssessmentDraftConflictError);
  } finally {
    await db.close();
  }
});

test("M2.08 autosave is silent in audit/timeline and never moves assessment progress", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "draft-silent");
    const fixture = await seedInProgressAttempt(db, principal, "draft-silent", [
      { questionType: "LONG_TEXT" },
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptRecoveryService(db);
    const beforeAudit = await countRows(db, "platform_audit_events");
    const beforeTimeline = await countRows(db, "assurance_case_timeline_events");

    await service.saveDraft(
      principal,
      input(
        fixture,
        fixture.items[0],
        "  sensitive draft text stays out of audit  ",
        "mutation-draft-silent-1",
        null
      ),
      ATTEMPT_NOW_DATE
    );

    assert.equal(await countRows(db, "platform_audit_events"), beforeAudit);
    assert.equal(await countRows(db, "assurance_case_timeline_events"), beforeTimeline);
    assert.equal(
      await countRows(db, "assessment_attempt_answers", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    const attempt = await storedAttempt(db, fixture.attemptId);
    assert.equal(attempt.status, "IN_PROGRESS");
    assert.equal(Number(attempt.current_position), 1);
  } finally {
    await db.close();
  }
});