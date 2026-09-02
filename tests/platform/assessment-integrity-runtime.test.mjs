import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

const runtime = process.env.HSE_ASSESSMENT_INTEGRITY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_INTEGRITY_RUNTIME_DIST is required");
const integrityModule = await import(
  pathToFileURL(join(runtime, "assessment-integrity", "assessment-integrity-service.js")).href
);
const {
  AssessmentIntegrityService,
  AssessmentIntegrityAccessError,
  AssessmentIntegrityConflictError,
  AssessmentIntegrityInputError
} = integrityModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-09-integrity-runtime",
  sessionSecret: "m2-09-integrity-runtime-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-09-integrity-runtime-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

const DEVICE_NONCE = "device_nonce_m209_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_DEVICE_NONCE = "device_nonce_m209_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const digest = (value) => createHash("sha256").update(value).digest("hex");

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0044_assessment_integrity_engine");
  return db;
}

async function fixture(db, seed) {
  const principal = await seedWorkerPrincipal(db, seed);
  const attempt = await seedInProgressAttempt(db, principal, seed, [
    { questionType: "SHORT_TEXT" },
    { questionType: "TRUE_FALSE" }
  ]);
  return { principal, attempt };
}

test("start/resume binds trusted auth session + device nonce, stores digests only, and rotates lease", async () => {
  const db = await database();
  try {
    const { principal, attempt } = await fixture(db, "m209-start-resume");
    const service = new AssessmentIntegrityService(db);

    const first = await service.startOrResume(
      principal,
      { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
      ATTEMPT_NOW_DATE
    );
    assert.equal(first.session.attemptId, attempt.attemptId);
    assert.equal(first.session.status, "ACTIVE");
    assert.equal(first.session.classification, "GREEN");
    assert.equal(first.session.monitoringState, "NORMAL");
    assert.match(first.leaseToken, /^[A-Za-z0-9_-]{40,100}$/);
    assert.equal("deviceBindingDigest" in first.session, false);
    assert.equal("leaseDigest" in first.session, false);

    const stored = await db.query(
      `SELECT integrity_session_id,attempt_id,worker_account_id,form_id,policy_version,
              device_binding_digest,lease_digest
       FROM assessment_integrity_sessions
       WHERE attempt_id=$1`,
      [attempt.attemptId]
    );
    assert.equal(stored.rows.length, 1);
    assert.equal(stored.rows[0].integrity_session_id, first.session.integritySessionId);
    assert.equal(stored.rows[0].worker_account_id, principal.accountId);
    assert.equal(stored.rows[0].form_id, attempt.formId);
    assert.equal(
      stored.rows[0].device_binding_digest,
      digest(`m2.09-device-binding\0${principal.sessionId}\0${DEVICE_NONCE}`)
    );
    assert.equal(stored.rows[0].lease_digest, digest(`m2.09-lease\0${first.leaseToken}`));
    assert.notEqual(stored.rows[0].device_binding_digest, DEVICE_NONCE);
    assert.notEqual(stored.rows[0].lease_digest, first.leaseToken);

    const resumed = await service.startOrResume(
      principal,
      { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
      new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
    );
    assert.equal(resumed.session.integritySessionId, first.session.integritySessionId);
    assert.notEqual(resumed.leaseToken, first.leaseToken);

    const count = await db.query(
      "SELECT COUNT(*)::int AS count FROM assessment_integrity_sessions WHERE attempt_id=$1",
      [attempt.attemptId]
    );
    assert.equal(count.rows[0].count, 1);

    await assert.rejects(
      service.ingestBrowserEvents(
        principal,
        {
          attemptId: attempt.attemptId,
          integritySessionId: first.session.integritySessionId,
          leaseToken: first.leaseToken,
          events: [
            {
              idempotencyKey: "m209-stale-lease-event-0001",
              signal: "HEARTBEAT",
              metadata: { online: true }
            }
          ]
        },
        new Date(ATTEMPT_NOW_DATE.getTime() + 2_000)
      ),
      AssessmentIntegrityConflictError
    );
  } finally {
    await db.close();
  }
});

test("live active device lease cannot be silently taken over and foreign Worker authority fails closed", async () => {
  const db = await database();
  try {
    const { principal, attempt } = await fixture(db, "m209-device-authority");
    const foreign = await seedWorkerPrincipal(db, "m209-device-authority-foreign");
    const service = new AssessmentIntegrityService(db);

    await service.startOrResume(
      principal,
      { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
      ATTEMPT_NOW_DATE
    );

    await assert.rejects(
      service.startOrResume(
        principal,
        { attemptId: attempt.attemptId, deviceNonce: OTHER_DEVICE_NONCE },
        new Date(ATTEMPT_NOW_DATE.getTime() + 1_000)
      ),
      AssessmentIntegrityConflictError
    );
    await assert.rejects(
      service.startOrResume(
        foreign,
        { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
        ATTEMPT_NOW_DATE
      ),
      AssessmentIntegrityAccessError
    );
  } finally {
    await db.close();
  }
});

test("submitted attempts cannot create a new active integrity session", async () => {
  const db = await database();
  try {
    const { principal, attempt } = await fixture(db, "m209-submitted-start");
    await db.query(
      `UPDATE assessment_attempts
       SET status='SUBMITTED',current_position=question_count,submitted_at=$2,updated_at=$2
       WHERE attempt_id=$1`,
      [attempt.attemptId, ATTEMPT_NOW_DATE.toISOString()]
    );

    await assert.rejects(
      new AssessmentIntegrityService(db).startOrResume(
        principal,
        { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
        ATTEMPT_NOW_DATE
      ),
      AssessmentIntegrityConflictError
    );
  } finally {
    await db.close();
  }
});

test("browser ingestion is server-ordered, idempotent, source-limited, and ignores spoofed authority", async () => {
  const db = await database();
  try {
    const { principal, attempt } = await fixture(db, "m209-browser-ingest");
    const service = new AssessmentIntegrityService(db);
    const started = await service.startOrResume(
      principal,
      { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
      ATTEMPT_NOW_DATE
    );

    const input = {
      attemptId: attempt.attemptId,
      integritySessionId: started.session.integritySessionId,
      leaseToken: started.leaseToken,
      workerAccountId: "account_attacker",
      formId: "assessment_form_attacker",
      classification: "GREEN",
      policyVersion: "attacker-policy",
      events: [
        {
          idempotencyKey: "m209-browser-event-00000001",
          signal: "TAB_HIDDEN",
          source: "SYSTEM",
          classification: "GREEN",
          observedAt: "2026-08-31T20:09:59.000Z",
          metadata: { capability: "browser", state: "hidden", visible: false }
        }
      ]
    };

    const accepted = await service.ingestBrowserEvents(
      principal,
      input,
      new Date("2026-08-31T20:10:01.000Z")
    );
    assert.equal(accepted.events.length, 1);
    assert.equal(accepted.events[0].source, "BROWSER");
    assert.equal(accepted.events[0].signal, "TAB_HIDDEN");
    assert.equal(accepted.events[0].sequenceNo, 2);
    assert.equal(accepted.events[0].receivedAt, "2026-08-31T20:10:01.000Z");
    assert.equal("idempotencyKey" in accepted.events[0], false);
    assert.equal("payloadDigest" in accepted.events[0], false);

    const replay = await service.ingestBrowserEvents(
      principal,
      input,
      new Date("2026-08-31T20:10:02.000Z")
    );
    assert.equal(replay.events[0].eventId, accepted.events[0].eventId);

    const count = await db.query(
      `SELECT COUNT(*)::int AS count
       FROM assessment_integrity_events
       WHERE integrity_session_id=$1 AND idempotency_key=$2`,
      [started.session.integritySessionId, "m209-browser-event-00000001"]
    );
    assert.equal(count.rows[0].count, 1);

    const stored = await db.query(
      `SELECT source,signal_key,received_at,metadata_json
       FROM assessment_integrity_events
       WHERE event_id=$1`,
      [accepted.events[0].eventId]
    );
    assert.equal(stored.rows[0].source, "BROWSER");
    assert.equal(stored.rows[0].signal_key, "TAB_HIDDEN");
    assert.equal(new Date(stored.rows[0].received_at).toISOString(), "2026-08-31T20:10:01.000Z");
    assert.deepEqual(stored.rows[0].metadata_json, {
      capability: "browser",
      state: "hidden",
      visible: false
    });

    await assert.rejects(
      service.ingestBrowserEvents(
        principal,
        {
          ...input,
          events: [{ ...input.events[0], signal: "WINDOW_BLUR" }]
        },
        new Date("2026-08-31T20:10:03.000Z")
      ),
      AssessmentIntegrityConflictError
    );

    await assert.rejects(
      service.ingestBrowserEvents(
        principal,
        {
          attemptId: attempt.attemptId,
          integritySessionId: started.session.integritySessionId,
          leaseToken: started.leaseToken,
          events: [
            {
              idempotencyKey: "m209-provider-spoof-000001",
              signal: "MULTIPLE_FACE_DETECTED",
              metadata: { capability: "camera" }
            }
          ]
        },
        new Date("2026-08-31T20:10:04.000Z")
      ),
      AssessmentIntegrityInputError
    );
  } finally {
    await db.close();
  }
});

test("evidence timeline is server ordered and never exposes lease/device/idempotency digests", async () => {
  const db = await database();
  try {
    const { principal, attempt } = await fixture(db, "m209-timeline");
    const service = new AssessmentIntegrityService(db);
    const started = await service.startOrResume(
      principal,
      { attemptId: attempt.attemptId, deviceNonce: DEVICE_NONCE },
      ATTEMPT_NOW_DATE
    );

    await service.ingestBrowserEvents(
      principal,
      {
        attemptId: attempt.attemptId,
        integritySessionId: started.session.integritySessionId,
        leaseToken: started.leaseToken,
        events: [
          {
            idempotencyKey: "m209-timeline-event-000001",
            signal: "WINDOW_BLUR",
            metadata: { capability: "browser", state: "blurred" }
          },
          {
            idempotencyKey: "m209-timeline-event-000002",
            signal: "WINDOW_FOCUS",
            metadata: { capability: "browser", state: "focused" }
          }
        ]
      },
      new Date("2026-08-31T20:10:01.000Z")
    );

    const timeline = await service.getOwnedEvidenceTimeline(
      principal,
      attempt.attemptId,
      new Date("2026-08-31T20:10:02.000Z")
    );
    assert.deepEqual(timeline.map((item) => item.sequenceNo), [1, 2, 3]);
    assert.deepEqual(timeline.map((item) => item.signal), [
      "SESSION_STARTED",
      "WINDOW_BLUR",
      "WINDOW_FOCUS"
    ]);
    const serialized = JSON.stringify(timeline);
    assert.doesNotMatch(serialized, /lease|deviceBinding|payloadDigest|idempotency/i);
    assert.doesNotMatch(serialized, new RegExp(started.leaseToken));
    assert.doesNotMatch(serialized, new RegExp(DEVICE_NONCE));
  } finally {
    await db.close();
  }
});
