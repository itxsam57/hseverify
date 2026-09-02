-- M2.09 Integrity Engine.
-- Server-authoritative integrity sessions and immutable normalized evidence events.
-- This migration intentionally does not change assessment_attempts lifecycle status vocabulary.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assessment_attempts_integrity_lineage_uq'
  ) THEN
    ALTER TABLE assessment_attempts
      ADD CONSTRAINT assessment_attempts_integrity_lineage_uq
      UNIQUE (attempt_id, worker_account_id, form_id);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS assessment_integrity_sessions (
  integrity_session_id TEXT PRIMARY KEY CHECK (
    integrity_session_id ~ '^integrity_session_[A-Za-z0-9_-]{24}$'
  ),
  attempt_id TEXT NOT NULL,
  worker_account_id TEXT NOT NULL
    REFERENCES auth_accounts(account_id) ON DELETE RESTRICT,
  form_id TEXT NOT NULL,
  policy_version TEXT NOT NULL CHECK (
    char_length(policy_version) BETWEEN 1 AND 120
    AND policy_version = btrim(policy_version)
  ),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'ENDED')),
  classification TEXT NOT NULL CHECK (
    classification IN ('GREEN', 'YELLOW', 'RED')
  ),
  monitoring_state TEXT NOT NULL CHECK (
    monitoring_state IN ('NORMAL', 'DEGRADED')
  ),
  device_binding_digest TEXT NOT NULL CHECK (
    char_length(device_binding_digest) = 64
    AND device_binding_digest ~ '^[a-f0-9]{64}$'
  ),
  lease_digest TEXT NOT NULL CHECK (
    char_length(lease_digest) = 64
    AND lease_digest ~ '^[a-f0-9]{64}$'
  ),
  lease_expires_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (attempt_id),
  UNIQUE (integrity_session_id, attempt_id),
  CONSTRAINT assessment_integrity_sessions_attempt_lineage_fk
    FOREIGN KEY (attempt_id, worker_account_id, form_id)
    REFERENCES assessment_attempts (attempt_id, worker_account_id, form_id)
    ON DELETE RESTRICT,
  CHECK (last_seen_at >= started_at),
  CHECK (lease_expires_at >= last_seen_at),
  CHECK (updated_at >= created_at),
  CHECK (
    (status = 'ACTIVE' AND ended_at IS NULL) OR
    (status = 'ENDED' AND ended_at IS NOT NULL AND ended_at >= started_at)
  )
);

CREATE INDEX IF NOT EXISTS assessment_integrity_sessions_worker_idx
  ON assessment_integrity_sessions (worker_account_id, status, updated_at DESC, integrity_session_id);
CREATE INDEX IF NOT EXISTS assessment_integrity_sessions_attempt_idx
  ON assessment_integrity_sessions (attempt_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS assessment_integrity_events (
  event_id TEXT PRIMARY KEY CHECK (
    event_id ~ '^integrity_event_[A-Za-z0-9_-]{24}$'
  ),
  integrity_session_id TEXT NOT NULL,
  attempt_id TEXT NOT NULL,
  sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
  idempotency_key TEXT NOT NULL CHECK (
    char_length(idempotency_key) BETWEEN 16 AND 160
    AND idempotency_key = btrim(idempotency_key)
  ),
  payload_digest TEXT NOT NULL CHECK (
    char_length(payload_digest) = 64
    AND payload_digest ~ '^[a-f0-9]{64}$'
  ),
  source TEXT NOT NULL CHECK (source IN ('BROWSER', 'PROVIDER', 'SYSTEM')),
  signal_key TEXT NOT NULL CHECK (
    signal_key IN (
      'SESSION_STARTED',
      'HEARTBEAT',
      'IDENTITY_RECONFIRMED',
      'WEBCAM_PRESENT',
      'WEBCAM_ABSENT',
      'MULTIPLE_FACE_DETECTED',
      'MICROPHONE_INTERRUPTED',
      'ADDITIONAL_VOICE_DETECTED',
      'SCREEN_SHARE_STARTED',
      'SCREEN_SHARE_STOPPED',
      'TAB_HIDDEN',
      'TAB_VISIBLE',
      'WINDOW_BLUR',
      'WINDOW_FOCUS',
      'FULLSCREEN_EXIT',
      'FULLSCREEN_ENTER',
      'COPY_ATTEMPT',
      'PASTE_ATTEMPT',
      'CONNECTION_LOST',
      'CONNECTION_RESTORED',
      'MEDIA_PERMISSION_DENIED',
      'MEDIA_TRACK_MUTED',
      'MEDIA_TRACK_ENDED',
      'PROVIDER_DEGRADED',
      'DEVICE_CHANGED',
      'TECHNICAL_REPORT',
      'EMERGENCY_EXIT',
      'SESSION_ENDED'
    )
  ),
  observed_at TIMESTAMPTZ NULL,
  received_at TIMESTAMPTZ NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata_json) = 'object'
  ),
  UNIQUE (integrity_session_id, sequence_no),
  UNIQUE (integrity_session_id, idempotency_key),
  CONSTRAINT assessment_integrity_events_session_attempt_fk
    FOREIGN KEY (integrity_session_id, attempt_id)
    REFERENCES assessment_integrity_sessions (integrity_session_id, attempt_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS assessment_integrity_events_attempt_idx
  ON assessment_integrity_events (attempt_id, received_at, sequence_no);
CREATE INDEX IF NOT EXISTS assessment_integrity_events_session_idx
  ON assessment_integrity_events (integrity_session_id, sequence_no);

CREATE OR REPLACE FUNCTION assessment_integrity_events_immutable_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Assessment integrity evidence is immutable.';
END;
$$;

DROP TRIGGER IF EXISTS assessment_integrity_events_immutable_trigger
  ON assessment_integrity_events;

CREATE TRIGGER assessment_integrity_events_immutable_trigger
BEFORE UPDATE OR DELETE ON assessment_integrity_events
FOR EACH ROW
EXECUTE FUNCTION assessment_integrity_events_immutable_guard();
