import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW,
  seedInProgressAttempt,
  seedWorkerPrincipal,
  stableId
} from "../helpers/assessment-attempt-fixture.mjs";

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-09-integrity-rollback-runtime",
  sessionSecret: "m2-09-integrity-rollback-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-09-integrity-rollback-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

const LEASE_EXPIRES_AT = "2026-08-31T20:20:00.000Z";

async function relationExists(db, relation) {
  const result = await db.query(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [`public.${relation}`]
  );
  return result.rows[0]?.exists === true;
}

async function constraintExists(db, constraint) {
  const result = await db.query(
    "SELECT EXISTS(SELECT 1 FROM pg_constraint WHERE conname=$1) AS exists",
    [constraint]
  );
  return result.rows[0]?.exists === true;
}

async function requiredSource(path) {
  const content = await readFile(resolve(path), "utf8").catch(() => "");
  assert.ok(content.trim(), `${path} is missing`);
  return content;
}

test("M2.09 migration enforces immutable evidence, rolls back locally, and reapplies cleanly", async () => {
  const up = await requiredSource("database/migrations/0044_assessment_integrity_engine.up.sql");
  const down = await requiredSource("database/migrations/0044_assessment_integrity_engine.down.sql");
  const db = await openScriptDatabase(ENV);

  try {
    await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_drafts");
    const principal = await seedWorkerPrincipal(db, "m209-integrity-rollback");
    const fixture = await seedInProgressAttempt(
      db,
      principal,
      "m209-integrity-rollback",
      [{ questionType: "SHORT_TEXT" }]
    );

    await db.execute(up);
    assert.equal(await relationExists(db, "assessment_integrity_sessions"), true);
    assert.equal(await relationExists(db, "assessment_integrity_events"), true);
    assert.equal(await constraintExists(db, "assessment_attempts_integrity_lineage_uq"), true);

    const integritySessionId = stableId("integrity_session", "m209-integrity-rollback");
    const eventId = stableId("integrity_event", "m209-integrity-rollback-start");

    await db.query(
      `INSERT INTO assessment_integrity_sessions(
         integrity_session_id,attempt_id,worker_account_id,form_id,policy_version,
         status,classification,monitoring_state,device_binding_digest,lease_digest,
         lease_expires_at,started_at,last_seen_at,ended_at,created_at,updated_at
       ) VALUES($1,$2,$3,$4,'m2.09-v1','ACTIVE','GREEN','NORMAL',$5,$6,$7,$8,$8,NULL,$8,$8)`,
      [
        integritySessionId,
        fixture.attemptId,
        principal.accountId,
        fixture.formId,
        "a".repeat(64),
        "b".repeat(64),
        LEASE_EXPIRES_AT,
        ATTEMPT_NOW
      ]
    );

    await db.query(
      `INSERT INTO assessment_integrity_events(
         event_id,integrity_session_id,attempt_id,sequence_no,idempotency_key,payload_digest,
         source,signal_key,observed_at,received_at,metadata_json
       ) VALUES($1,$2,$3,1,$4,$5,'SYSTEM','SESSION_STARTED',NULL,$6,$7::jsonb)`,
      [
        eventId,
        integritySessionId,
        fixture.attemptId,
        "m209-integrity-start-0001",
        "c".repeat(64),
        ATTEMPT_NOW,
        JSON.stringify({ reason: "assessment_started" })
      ]
    );

    await assert.rejects(
      db.query(
        "UPDATE assessment_integrity_events SET signal_key='HEARTBEAT' WHERE event_id=$1",
        [eventId]
      ),
      /immutable/i
    );
    await assert.rejects(
      db.query("DELETE FROM assessment_integrity_events WHERE event_id=$1", [eventId]),
      /immutable/i
    );

    const evidence = await db.query(
      `SELECT sequence_no,source,signal_key
       FROM assessment_integrity_events
       WHERE event_id=$1`,
      [eventId]
    );
    assert.deepEqual(evidence.rows, [
      { sequence_no: 1, source: "SYSTEM", signal_key: "SESSION_STARTED" }
    ]);

    await db.execute(down);
    assert.equal(await relationExists(db, "assessment_integrity_events"), false);
    assert.equal(await relationExists(db, "assessment_integrity_sessions"), false);
    assert.equal(await constraintExists(db, "assessment_attempts_integrity_lineage_uq"), false);

    for (const relation of [
      "assessment_attempts",
      "assessment_attempt_answers",
      "assessment_attempt_drafts",
      "generated_assessment_forms",
      "generated_assessment_form_items"
    ]) {
      assert.equal(await relationExists(db, relation), true, `${relation} must survive M2.09 rollback`);
    }

    const preserved = await db.query(
      `SELECT worker_account_id,form_id,status,current_position,submitted_at
       FROM assessment_attempts
       WHERE attempt_id=$1`,
      [fixture.attemptId]
    );
    assert.deepEqual(preserved.rows, [
      {
        worker_account_id: principal.accountId,
        form_id: fixture.formId,
        status: "IN_PROGRESS",
        current_position: 1,
        submitted_at: null
      }
    ]);

    await db.execute(up);
    assert.equal(await relationExists(db, "assessment_integrity_sessions"), true);
    assert.equal(await relationExists(db, "assessment_integrity_events"), true);
    assert.equal(await constraintExists(db, "assessment_attempts_integrity_lineage_uq"), true);

    const historicalAttempt = await db.query(
      "SELECT COUNT(*)::int AS count FROM assessment_attempts WHERE attempt_id=$1",
      [fixture.attemptId]
    );
    assert.equal(historicalAttempt.rows[0]?.count, 1);
  } finally {
    await db.close();
  }
});
