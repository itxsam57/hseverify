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
const { AssessmentAttemptService } = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-service.js")).href
);

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-paused-view-runtime",
  sessionSecret: "m2-08-paused-view-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-paused-view-auth-pepper-more-than-thirty-two-characters",
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

test("M2.08 paused INTERRUPTED and RECOVERABLE owned views do not project the current question before explicit resume", async () => {
  const db = await database();
  try {
    const principal = await seedWorkerPrincipal(db, "paused-view");
    const fixture = await seedInProgressAttempt(db, principal, "paused-view", [
      { questionType: "TRUE_FALSE" }
    ]);
    const service = new AssessmentAttemptService(db);

    await db.query(
      `UPDATE assessment_attempts
       SET status='INTERRUPTED',updated_at=$2
       WHERE attempt_id=$1 AND status='IN_PROGRESS'`,
      [fixture.attemptId, ATTEMPT_NOW_DATE.toISOString()]
    );
    const interrupted = await service.getOwnedView(
      principal,
      fixture.attemptId,
      ATTEMPT_NOW_DATE
    );
    assert.equal(interrupted.attempt.status, "INTERRUPTED");
    assert.equal(interrupted.submitted, false);
    assert.equal(interrupted.currentQuestion, null);

    await db.query(
      `UPDATE assessment_attempts
       SET status='RECOVERABLE',updated_at=$2
       WHERE attempt_id=$1 AND status='INTERRUPTED'`,
      [fixture.attemptId, ATTEMPT_NOW_DATE.toISOString()]
    );
    const recoverable = await service.getOwnedView(
      principal,
      fixture.attemptId,
      ATTEMPT_NOW_DATE
    );
    assert.equal(recoverable.attempt.status, "RECOVERABLE");
    assert.equal(recoverable.submitted, false);
    assert.equal(recoverable.currentQuestion, null);
  } finally {
    await db.close();
  }
});
