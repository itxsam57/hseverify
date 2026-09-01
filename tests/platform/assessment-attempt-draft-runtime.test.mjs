import assert from "node:assert/strict";
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
  seedWorkerPrincipal
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
