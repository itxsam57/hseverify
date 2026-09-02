import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path) {
  try {
    return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return "";
    throw error;
  }
}

const up = source("database/migrations/0044_assessment_integrity_engine.up.sql");
const down = source("database/migrations/0044_assessment_integrity_engine.down.sql");
const domain = source("src/lib/assessment-integrity/assessment-integrity-domain.ts");
const attemptDomain = source("src/lib/assessment-attempt/assessment-attempt-domain.ts");

test("M2.09 keeps the accepted assessment attempt lifecycle vocabulary unchanged", () => {
  assert.match(
    attemptDomain,
    /ASSESSMENT_ATTEMPT_STATUSES\s*=\s*\[\s*["']IN_PROGRESS["']\s*,\s*["']SUBMITTED["']\s*\]\s*as const/
  );
  assert.doesNotMatch(attemptDomain, /INTEGRITY|INVALIDATED|REVIEW_PENDING/);
});

test("0044 creates one integrity session per attempt with frozen server rollup authority", () => {
  assert.match(up, /CREATE TABLE IF NOT EXISTS assessment_integrity_sessions/i);
  assert.match(up, /attempt_id\s+TEXT\s+NOT NULL/i);
  assert.match(up, /UNIQUE\s*\(\s*attempt_id\s*\)/i);
  assert.match(up, /worker_account_id\s+TEXT\s+NOT NULL/i);
  assert.match(up, /form_id\s+TEXT\s+NOT NULL/i);
  assert.match(up, /policy_version\s+TEXT\s+NOT NULL/i);
  assert.match(up, /status\s+TEXT\s+NOT NULL[\s\S]*ACTIVE[\s\S]*ENDED/i);
  assert.match(up, /classification\s+TEXT\s+NOT NULL[\s\S]*GREEN[\s\S]*YELLOW[\s\S]*RED/i);
  assert.match(up, /monitoring_state\s+TEXT\s+NOT NULL[\s\S]*NORMAL[\s\S]*DEGRADED/i);
  assert.match(up, /device_binding_digest\s+TEXT\s+NOT NULL/i);
  assert.match(up, /lease_digest\s+TEXT\s+NOT NULL/i);
  assert.match(up, /char_length\s*\(\s*device_binding_digest\s*\)\s*=\s*64/i);
  assert.match(up, /char_length\s*\(\s*lease_digest\s*\)\s*=\s*64/i);
  assert.match(up, /lease_expires_at\s+TIMESTAMPTZ\s+NOT NULL/i);
  assert.match(up, /last_seen_at\s+TIMESTAMPTZ\s+NOT NULL/i);
  assert.match(up, /ended_at\s+TIMESTAMPTZ\s+NULL/i);
});

test("0044 creates an append-only idempotent server-ordered integrity event ledger", () => {
  assert.match(up, /CREATE TABLE IF NOT EXISTS assessment_integrity_events/i);
  assert.match(up, /integrity_session_id\s+TEXT\s+NOT NULL/i);
  assert.match(up, /attempt_id\s+TEXT\s+NOT NULL/i);
  assert.match(up, /sequence_no\s+INTEGER\s+NOT NULL/i);
  assert.match(up, /idempotency_key\s+TEXT\s+NOT NULL/i);
  assert.match(up, /payload_digest\s+TEXT\s+NOT NULL/i);
  assert.match(up, /source\s+TEXT\s+NOT NULL[\s\S]*BROWSER[\s\S]*PROVIDER[\s\S]*SYSTEM/i);
  assert.match(up, /signal_key\s+TEXT\s+NOT NULL/i);
  assert.match(up, /observed_at\s+TIMESTAMPTZ\s+NULL/i);
  assert.match(up, /received_at\s+TIMESTAMPTZ\s+NOT NULL/i);
  assert.match(up, /metadata_json\s+JSONB\s+NOT NULL/i);
  assert.match(up, /UNIQUE\s*\(\s*integrity_session_id\s*,\s*sequence_no\s*\)/i);
  assert.match(up, /UNIQUE\s*\(\s*integrity_session_id\s*,\s*idempotency_key\s*\)/i);
  assert.match(up, /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION[\s\S]*integrity[\s\S]*immutable/i);
  assert.match(up, /CREATE TRIGGER[\s\S]*(?:UPDATE|DELETE)[\s\S]*assessment_integrity_events/i);
});

test("M2.09 domain freezes public, source and normalized signal vocabularies", () => {
  assert.match(domain, /INTEGRITY_CLASSIFICATIONS\s*=\s*\[[\s\S]*GREEN[\s\S]*YELLOW[\s\S]*RED[\s\S]*\]\s*as const/);
  assert.match(domain, /INTEGRITY_MONITORING_STATES\s*=\s*\[[\s\S]*NORMAL[\s\S]*DEGRADED[\s\S]*\]\s*as const/);
  assert.match(domain, /INTEGRITY_EVENT_SOURCES\s*=\s*\[[\s\S]*BROWSER[\s\S]*PROVIDER[\s\S]*SYSTEM[\s\S]*\]\s*as const/);

  for (const signal of [
    "SESSION_STARTED",
    "HEARTBEAT",
    "IDENTITY_RECONFIRMED",
    "WEBCAM_PRESENT",
    "WEBCAM_ABSENT",
    "MULTIPLE_FACE_DETECTED",
    "MICROPHONE_INTERRUPTED",
    "ADDITIONAL_VOICE_DETECTED",
    "SCREEN_SHARE_STARTED",
    "SCREEN_SHARE_STOPPED",
    "TAB_HIDDEN",
    "TAB_VISIBLE",
    "WINDOW_BLUR",
    "WINDOW_FOCUS",
    "FULLSCREEN_EXIT",
    "FULLSCREEN_ENTER",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "CONNECTION_LOST",
    "CONNECTION_RESTORED",
    "MEDIA_PERMISSION_DENIED",
    "MEDIA_TRACK_MUTED",
    "MEDIA_TRACK_ENDED",
    "PROVIDER_DEGRADED",
    "DEVICE_CHANGED",
    "TECHNICAL_REPORT",
    "EMERGENCY_EXIT",
    "SESSION_ENDED"
  ]) {
    assert.match(domain, new RegExp(`(?:"|')${signal}(?:"|')`), `missing signal ${signal}`);
  }

  assert.match(domain, /createIntegritySessionId/);
  assert.match(domain, /createIntegrityEventId/);
  assert.match(domain, /isIntegritySignal/);
  assert.match(domain, /isIntegrityEventSource/);
});

test("0044 rollback is M2.09-local and cannot drop accepted attempt/draft/answer tables", () => {
  assert.match(down, /DROP TABLE IF EXISTS assessment_integrity_events/i);
  assert.match(down, /DROP TABLE IF EXISTS assessment_integrity_sessions/i);
  assert.doesNotMatch(down, /DROP TABLE IF EXISTS assessment_attempts/i);
  assert.doesNotMatch(down, /DROP TABLE IF EXISTS assessment_attempt_answers/i);
  assert.doesNotMatch(down, /DROP TABLE IF EXISTS assessment_attempt_drafts/i);
});
