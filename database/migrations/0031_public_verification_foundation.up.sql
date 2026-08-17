-- M1.12 Public Verification Foundation.
--
-- Public verification is read-only projection plus abuse control and immutable
-- concern intake. It does not create credential issuance, reviewer decisions or
-- public evidence access. Concern intake history is monotonic and intentionally
-- has no hard foreign key to Worker identity or secure-file lower bricks.

CREATE TABLE IF NOT EXISTS public_verification_rate_limits (
  action TEXT NOT NULL
    CONSTRAINT public_verification_rate_limits_action_check
    CHECK (action IN ('lookup', 'result', 'concern', 'concern_upload')),
  bucket_key TEXT NOT NULL
    CONSTRAINT public_verification_rate_limits_bucket_key_check
    CHECK (
      char_length(bucket_key) = 64
      AND bucket_key ~ '^[a-f0-9]{64}$'
    ),
  window_started_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL
    CONSTRAINT public_verification_rate_limits_attempt_count_check
    CHECK (attempt_count >= 1),
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (action, bucket_key),
  CONSTRAINT public_verification_rate_limits_timestamp_check
    CHECK (updated_at >= window_started_at)
);

CREATE INDEX IF NOT EXISTS public_verification_rate_limits_window_idx
  ON public_verification_rate_limits (action, window_started_at, updated_at);

CREATE TABLE IF NOT EXISTS public_verification_concerns (
  concern_id TEXT PRIMARY KEY
    CONSTRAINT public_verification_concerns_id_check
    CHECK (concern_id ~ '^public_concern_[A-Za-z0-9_-]{24}$'),
  subject_reference_hash TEXT NOT NULL
    CONSTRAINT public_verification_concerns_subject_hash_check
    CHECK (
      char_length(subject_reference_hash) = 64
      AND subject_reference_hash ~ '^[a-f0-9]{64}$'
    ),
  category TEXT NOT NULL
    CONSTRAINT public_verification_concerns_category_check
    CHECK (
      category IN (
        'identity_mismatch',
        'suspected_fraud',
        'status_dispute',
        'document_concern',
        'other'
      )
    ),
  description TEXT NOT NULL
    CONSTRAINT public_verification_concerns_description_check
    CHECK (
      char_length(description) BETWEEN 10 AND 4000
      AND description = btrim(description)
    ),
  contact_name TEXT NULL
    CONSTRAINT public_verification_concerns_contact_name_check
    CHECK (
      contact_name IS NULL OR (
        char_length(contact_name) BETWEEN 1 AND 160
        AND contact_name = btrim(contact_name)
      )
    ),
  contact_email TEXT NULL
    CONSTRAINT public_verification_concerns_contact_email_check
    CHECK (
      contact_email IS NULL OR (
        char_length(contact_email) BETWEEN 3 AND 320
        AND contact_email = btrim(contact_email)
      )
    ),
  contact_phone TEXT NULL
    CONSTRAINT public_verification_concerns_contact_phone_check
    CHECK (
      contact_phone IS NULL OR (
        char_length(contact_phone) BETWEEN 8 AND 32
        AND contact_phone = btrim(contact_phone)
      )
    ),
  intake_status TEXT NOT NULL DEFAULT 'received'
    CONSTRAINT public_verification_concerns_status_check
    CHECK (intake_status = 'received'),
  idempotency_key TEXT NOT NULL UNIQUE
    CONSTRAINT public_verification_concerns_idempotency_key_check
    CHECK (
      char_length(idempotency_key) = 64
      AND idempotency_key ~ '^[a-f0-9]{64}$'
    ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT public_verification_concerns_contact_check
    CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL),
  CONSTRAINT public_verification_concerns_timestamp_check
    CHECK (updated_at >= created_at)
);

CREATE INDEX IF NOT EXISTS public_verification_concerns_subject_created_idx
  ON public_verification_concerns (subject_reference_hash, created_at DESC, concern_id);

CREATE INDEX IF NOT EXISTS public_verification_concerns_status_created_idx
  ON public_verification_concerns (intake_status, created_at DESC, concern_id);

CREATE OR REPLACE FUNCTION hse_guard_public_verification_concern_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Public verification concern intake history is immutable.'
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS public_verification_concerns_history_guard
  ON public_verification_concerns;
CREATE TRIGGER public_verification_concerns_history_guard
BEFORE UPDATE OR DELETE ON public_verification_concerns
FOR EACH ROW EXECUTE FUNCTION hse_guard_public_verification_concern_history();