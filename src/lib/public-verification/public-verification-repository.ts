import "server-only";

import type { DatabaseClient } from "@/lib/database/database";
import {
  normalizePublicVerificationIdentifier,
  type PublicWorkerVerificationSource
} from "@/lib/public-verification/public-verification-domain";

export const PUBLIC_VERIFICATION_RATE_LIMIT_ACTIONS = Object.freeze([
  "lookup",
  "result",
  "concern",
  "concern_upload"
] as const);

export type PublicVerificationRateLimitAction =
  (typeof PUBLIC_VERIFICATION_RATE_LIMIT_ACTIONS)[number];

export type PublicVerificationRateLimitInput = {
  action: PublicVerificationRateLimitAction;
  bucketKey: string;
  now: string;
  resetBefore: string;
};

type PublicWorkerRow = {
  permanent_worker_id: string;
  lifecycle_status: string;
  legal_first_name: string;
  legal_last_name: string;
  issued_at: string | Date;
};

const HEX_64_PATTERN = /^[a-f0-9]{64}$/;

function normalizeTimestamp(value: string, label: string): string {
  if (typeof value !== "string" || value.length > 64) {
    throw new Error(`${label} is invalid.`);
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`${label} is invalid.`);
  }
  return parsed.toISOString();
}

function normalizeBucketKey(value: string): string {
  if (typeof value !== "string" || !HEX_64_PATTERN.test(value)) {
    throw new Error("Public verification rate-limit bucket is invalid.");
  }
  return value;
}

function normalizeAction(
  action: PublicVerificationRateLimitAction
): PublicVerificationRateLimitAction {
  if (!PUBLIC_VERIFICATION_RATE_LIMIT_ACTIONS.includes(action)) {
    throw new Error("Public verification rate-limit action is invalid.");
  }
  return action;
}

function timestamp(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error("Public Worker issue timestamp is invalid.");
  }
  return parsed.toISOString();
}

export class PublicVerificationRepository {
  constructor(private readonly database: DatabaseClient) {}

  async consumeRateLimit(
    input: PublicVerificationRateLimitInput
  ): Promise<number> {
    const action = normalizeAction(input.action);
    const bucketKey = normalizeBucketKey(input.bucketKey);
    const now = normalizeTimestamp(input.now, "Rate-limit timestamp");
    const resetBefore = normalizeTimestamp(
      input.resetBefore,
      "Rate-limit reset timestamp"
    );
    if (new Date(resetBefore).getTime() > new Date(now).getTime()) {
      throw new Error("Rate-limit reset timestamp cannot be after now.");
    }

    const result = await this.database.query<{
      attempt_count: number | bigint | string;
    }>(
      `INSERT INTO public_verification_rate_limits (
         action,
         bucket_key,
         window_started_at,
         attempt_count,
         updated_at
       ) VALUES ($1,$2,$3,1,$3)
       ON CONFLICT (action, bucket_key) DO UPDATE
       SET window_started_at = CASE
             WHEN public_verification_rate_limits.window_started_at <= $4
               THEN $3
             ELSE public_verification_rate_limits.window_started_at
           END,
           attempt_count = CASE
             WHEN public_verification_rate_limits.window_started_at <= $4
               THEN 1
             ELSE public_verification_rate_limits.attempt_count + 1
           END,
           updated_at = $3
       RETURNING attempt_count`,
      [action, bucketKey, now, resetBefore]
    );

    const count = Number(result.rows[0]?.attempt_count);
    if (!Number.isSafeInteger(count) || count < 1) {
      throw new Error("Public verification rate-limit update returned no count.");
    }
    return count;
  }

  async findPublicWorkerByPermanentId(
    workerId: string
  ): Promise<PublicWorkerVerificationSource | null> {
    const identifier = normalizePublicVerificationIdentifier(workerId);
    if (!identifier || identifier.kind !== "worker") return null;

    const result = await this.database.query<PublicWorkerRow>(
      `SELECT worker_ids.permanent_worker_id,
              identities.lifecycle_status,
              drafts.legal_first_name,
              drafts.legal_last_name,
              worker_ids.issued_at
         FROM worker_identity_worker_ids AS worker_ids
         JOIN worker_identities AS identities
           ON identities.identity_id = worker_ids.identity_id
         JOIN worker_identity_versions AS current_versions
           ON current_versions.identity_id = identities.identity_id
          AND current_versions.version_number = identities.current_version_number
          AND current_versions.version_status = 'submitted'
         JOIN worker_identity_version_drafts AS drafts
           ON drafts.identity_version_id = current_versions.identity_version_id
        WHERE worker_ids.permanent_worker_id = $1
        LIMIT 1`,
      [identifier.normalizedIdentifier]
    );
    const row = result.rows[0];
    if (!row) return null;

    return Object.freeze({
      permanentWorkerId: row.permanent_worker_id,
      lifecycleStatus: row.lifecycle_status,
      legalFirstName: row.legal_first_name,
      legalLastName: row.legal_last_name,
      issuedAt: timestamp(row.issued_at)
    });
  }
}