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
const attemptDomainModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-domain.js")).href
);

const { AssessmentAttemptRecoveryService } = recoveryModule;
const {
  AssessmentAttemptAccessError,
  AssessmentAttemptConflictError,
  AssessmentAttemptInputError
} = attemptDomainModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-technical-issue-runtime",
  sessionSecret: "m2-08-technical-issue-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-technical-issue-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

const CATEGORIES = [
  "CONNECTIVITY",
  "DISPLAY_OR_INPUT",
  "BROWSER_OR_DEVICE",
  "ACCESSIBILITY",
  "OTHER"
];

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_recovery");
  return db;
}

function request(fixture, item, seed, overrides = {}) {
  return {
    attemptId: fixture.attemptId,
    position: item.position,
    questionVersionId: item.questionVersionId,
    category: "CONNECTIVITY",
    description: "  The assessment page stopped responding while I remained online.  ",
    mode: "CONTINUE",
    mutationKey: `m2-08-issue-${seed}-0001`,
    ...overrides
  };
}

async function attemptStatus(db, attemptId) {
  const result = await db.query(
    `SELECT status,current_position,submitted_at
     FROM assessment_attempts
     WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0];
}

async function issueRows(db, attemptId) {
  const result = await db.query(
    `SELECT issue_id,attempt_id,position,question_version_id,category,description,
            mode,mutation_key,mutation_digest,reported_at
     FROM assessment_technical_issue_reports
     WHERE attempt_id=$1
     ORDER BY reported_at,issue_id`,
    [attemptId]
  );
  return result.rows;
}

async function evidenceRows(db, attemptId) {
  const audits = await db.query(
    `SELECT action_key,metadata
     FROM platform_audit_events
     WHERE target_reference=$1
       AND action_key IN (
         'assessment.technical_issue.reported',
         'assessment.attempt.interrupted'
       )
     ORDER BY audit_sequence`,
    [attemptId]
  );
  const timeline = await db.query(
    `SELECT event_type
     FROM assurance_case_timeline_events
     WHERE event_type IN (
       'assessment_technical_issue_reported',
       'assessment_attempt_interrupted'
     )
       AND case_id=(SELECT case_id FROM assessment_attempts WHERE attempt_id=$1)
     ORDER BY event_id`,
    [attemptId]
  );
  return { audits: audits.rows, timeline: timeline.rows };
}

test("M2.08 technical issue report-and-continue accepts every bounded category without changing lifecycle", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "issues-categories");
    const fixture = await seedInProgressAttempt(db, principal, "issues-categories", [
      { questionType: "SHORT_TEXT" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);

    for (const [index, category] of CATEGORIES.entries()) {
      const result = await service.reportTechnicalIssue(
        principal,
        request(fixture, item, `category-${index}`, {
          category,
          description: `  Bounded ${category} report ${index}.  `
        }),
        new Date(ATTEMPT_NOW_DATE.getTime() + index * 1_000)
      );
      assert.equal(result.attemptId, fixture.attemptId);
      assert.equal(result.status, "IN_PROGRESS");
      assert.equal(result.category, category);
      assert.equal(result.mode, "CONTINUE");
      assert.equal("description" in result, false);
    }

    const rows = await issueRows(db, fixture.attemptId);
    assert.equal(rows.length, 5);
    assert.deepEqual(rows.map((row) => row.category), CATEGORIES);
    assert.deepEqual(
      rows.map((row) => row.description),
      CATEGORIES.map((category, index) => `Bounded ${category} report ${index}.`)
    );
    const state = await attemptStatus(db, fixture.attemptId);
    assert.equal(state.status, "IN_PROGRESS");
    assert.equal(Number(state.current_position), 1);
    assert.equal(state.submitted_at, null);
    assert.equal(
      await countRows(db, "assessment_attempt_interruptions", "attempt_id=$1", [fixture.attemptId]),
      0
    );

    const evidence = await evidenceRows(db, fixture.attemptId);
    assert.equal(
      evidence.audits.filter((row) => row.action_key === "assessment.technical_issue.reported").length,
      5
    );
    assert.equal(
      evidence.timeline.filter((row) => row.event_type === "assessment_technical_issue_reported").length,
      5
    );
    const serializedEvidence = JSON.stringify(evidence).toLowerCase();
    for (const forbidden of [
      "bounded connectivity report",
      "bounded display_or_input report",
      "answer",
      "draft",
      "rubric",
      "score",
      "correct"
    ]) {
      assert.equal(serializedEvidence.includes(forbidden), false, `evidence leaked ${forbidden}`);
    }
  } finally {
    await db.close();
  }
});

test("M2.08 technical issue input rejects unknown category/mode and empty or oversized descriptions before persistence", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "issues-validation");
    const fixture = await seedInProgressAttempt(db, principal, "issues-validation", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);

    for (const [seed, overrides] of [
      ["category", { category: "NOT_A_CATEGORY" }],
      ["mode", { mode: "NOT_A_MODE" }],
      ["empty", { description: "   " }],
      ["oversized", { description: "😀".repeat(2_001) }]
    ]) {
      await assert.rejects(
        service.reportTechnicalIssue(
          principal,
          request(fixture, item, `invalid-${seed}`, overrides),
          ATTEMPT_NOW_DATE
        ),
        AssessmentAttemptInputError
      );
    }

    assert.equal(
      await countRows(db, "assessment_technical_issue_reports", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    assert.equal((await attemptStatus(db, fixture.attemptId)).status, "IN_PROGRESS");
  } finally {
    await db.close();
  }
});

test("M2.08 report-and-exit atomically creates report plus interruption, preserves the draft, and is idempotent", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "issues-exit");
    const fixture = await seedInProgressAttempt(db, principal, "issues-exit", [
      { questionType: "LONG_TEXT" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);

    await service.saveDraft(
      principal,
      {
        attemptId: fixture.attemptId,
        position: 1,
        questionVersionId: item.questionVersionId,
        value: "  draft survives technical issue exit  ",
        expectedRevision: null,
        mutationKey: "m2-08-issue-exit-draft-0001"
      },
      ATTEMPT_NOW_DATE
    );

    const input = request(fixture, item, "exit", {
      category: "BROWSER_OR_DEVICE",
      description: "  The browser input became unusable.  ",
      mode: "EXIT"
    });
    const first = await service.reportTechnicalIssue(principal, input, ATTEMPT_NOW_DATE);
    assert.equal(first.attemptId, fixture.attemptId);
    assert.equal(first.status, "INTERRUPTED");
    assert.equal(first.category, "BROWSER_OR_DEVICE");
    assert.equal(first.mode, "EXIT");
    assert.equal("description" in first, false);

    const retry = await service.reportTechnicalIssue(
      principal,
      input,
      new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
    );
    assert.deepEqual(retry, first);

    assert.equal(
      await countRows(
        db,
        "assessment_technical_issue_reports",
        "attempt_id=$1 AND mutation_key=$2",
        [fixture.attemptId, input.mutationKey]
      ),
      1
    );
    assert.equal(
      await countRows(
        db,
        "assessment_attempt_interruptions",
        "attempt_id=$1 AND mutation_key=$2 AND reason='TECHNICAL_ISSUE_EXIT'",
        [fixture.attemptId, input.mutationKey]
      ),
      1
    );
    const state = await attemptStatus(db, fixture.attemptId);
    assert.equal(state.status, "INTERRUPTED");
    assert.equal(Number(state.current_position), 1);

    const draft = await db.query(
      `SELECT text_value,revision
       FROM assessment_attempt_drafts
       WHERE attempt_id=$1`,
      [fixture.attemptId]
    );
    assert.equal(draft.rows.length, 1);
    assert.equal(draft.rows[0].text_value, "  draft survives technical issue exit  ");
    assert.equal(Number(draft.rows[0].revision), 1);

    const evidence = await evidenceRows(db, fixture.attemptId);
    assert.equal(
      evidence.audits.filter((row) => row.action_key === "assessment.technical_issue.reported").length,
      1
    );
    assert.equal(
      evidence.audits.filter((row) => row.action_key === "assessment.attempt.interrupted").length,
      1
    );
    assert.equal(
      evidence.timeline.filter((row) => row.event_type === "assessment_technical_issue_reported").length,
      1
    );
    assert.equal(
      evidence.timeline.filter((row) => row.event_type === "assessment_attempt_interrupted").length,
      1
    );
    assert.equal(JSON.stringify(evidence).includes("The browser input became unusable."), false);
  } finally {
    await db.close();
  }
});

test("M2.08 a technical issue mutation key cannot be reused for different report content", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "issues-key-reuse");
    const fixture = await seedInProgressAttempt(db, principal, "issues-key-reuse", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);
    const first = request(fixture, item, "same-key", {
      description: "First bounded issue description."
    });
    await service.reportTechnicalIssue(principal, first, ATTEMPT_NOW_DATE);

    await assert.rejects(
      service.reportTechnicalIssue(
        principal,
        { ...first, description: "Different issue content under the same mutation key." },
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptConflictError
    );
    assert.equal(
      await countRows(db, "assessment_technical_issue_reports", "attempt_id=$1", [fixture.attemptId]),
      1
    );
  } finally {
    await db.close();
  }
});

test("M2.08 technical issue reporting fails closed for another Worker, non-Worker role, and revoked session", async () => {
  const db = await database();
  try {
    const owner = await seedWorkerPrincipal(db, "issues-owner");
    const other = await seedWorkerPrincipal(db, "issues-other");
    const fixture = await seedInProgressAttempt(db, owner, "issues-owner", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);
    const input = request(fixture, item, "authorization");

    await assert.rejects(
      service.reportTechnicalIssue(other, input, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );
    await assert.rejects(
      service.reportTechnicalIssue(
        { ...owner, activeRole: "company" },
        input,
        ATTEMPT_NOW_DATE
      ),
      AssessmentAttemptAccessError
    );
    await db.query(
      `UPDATE auth_sessions
       SET revoked_at=$2,revocation_reason='m2_08_issue_test'
       WHERE session_id=$1`,
      [owner.sessionId, ATTEMPT_NOW_DATE.toISOString()]
    );
    await assert.rejects(
      service.reportTechnicalIssue(owner, input, ATTEMPT_NOW_DATE),
      AssessmentAttemptAccessError
    );

    assert.equal(
      await countRows(db, "assessment_technical_issue_reports", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    assert.equal((await attemptStatus(db, fixture.attemptId)).status, "IN_PROGRESS");
  } finally {
    await db.close();
  }
});

test("M2.08 report-and-exit rolls back the report when interruption persistence fails", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "issues-rollback");
    const fixture = await seedInProgressAttempt(db, principal, "issues-rollback", [
      { questionType: "TRUE_FALSE" }
    ]);
    const item = fixture.items[0];
    const service = new AssessmentAttemptRecoveryService(db);

    await db.execute(`
      CREATE OR REPLACE FUNCTION hse_m208_force_interruption_failure()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        RAISE EXCEPTION 'forced M2.08 interruption persistence failure';
      END; $$;
      CREATE TRIGGER m208_force_interruption_failure
      BEFORE INSERT ON assessment_attempt_interruptions
      FOR EACH ROW EXECUTE FUNCTION hse_m208_force_interruption_failure();
    `);

    await assert.rejects(
      service.reportTechnicalIssue(
        principal,
        request(fixture, item, "rollback", {
          description: "Exit must rollback if interruption cannot persist.",
          mode: "EXIT"
        }),
        ATTEMPT_NOW_DATE
      ),
      /forced M2\.08 interruption persistence failure/
    );

    assert.equal(
      await countRows(db, "assessment_technical_issue_reports", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    assert.equal(
      await countRows(db, "assessment_attempt_interruptions", "attempt_id=$1", [fixture.attemptId]),
      0
    );
    assert.equal((await attemptStatus(db, fixture.attemptId)).status, "IN_PROGRESS");
    const evidence = await evidenceRows(db, fixture.attemptId);
    assert.deepEqual(evidence, { audits: [], timeline: [] });
  } finally {
    await db.close();
  }
});

test("M2.08 technical issue storage has no automatic answer, draft, rubric, scoring, or capture columns", async () => {
  const db = await database();
  try {
    const columns = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name='assessment_technical_issue_reports'
       ORDER BY ordinal_position`
    );
    const names = columns.rows.map((row) => row.column_name);
    for (const forbidden of [
      "answer",
      "answer_key",
      "draft",
      "rubric",
      "score",
      "correctness",
      "screenshot",
      "video",
      "audio",
      "diagnostic"
    ]) {
      assert.equal(
        names.some((name) => name === forbidden || name.startsWith(`${forbidden}_`)),
        false,
        `technical issue storage exposed forbidden column family ${forbidden}`
      );
    }
    assert.deepEqual(names, [
      "issue_id",
      "attempt_id",
      "position",
      "question_version_id",
      "category",
      "description",
      "mode",
      "mutation_key",
      "mutation_digest",
      "reported_at"
    ]);
  } finally {
    await db.close();
  }
});
