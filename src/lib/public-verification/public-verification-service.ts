import "server-only";

import {
  mintPublicVerificationCapability,
  verifyPublicVerificationCapability
} from "@/lib/public-verification/public-verification-capability";
import {
  mapWorkerIdentityStatusToPublicStatus,
  normalizePublicVerificationIdentifier,
  projectPublicWorkerVerification,
  type PublicWorkerVerificationProjection,
  type PublicWorkerVerificationSource
} from "@/lib/public-verification/public-verification-domain";
import {
  publicVerificationIdentifierBucketKey
} from "@/lib/public-verification/public-verification-request";
import type {
  PublicVerificationRateLimitAction,
  PublicVerificationRateLimitInput
} from "@/lib/public-verification/public-verification-repository";

export type PublicVerificationStatusResult = {
  kind: "status";
  status: "not_found_or_invalid" | "temporarily_unavailable";
};

export type PublicVerificationLookupResult =
  | PublicVerificationStatusResult
  | {
      kind: "redirect";
      publicToken: string;
    };

export type PublicVerificationResolvedResult =
  | PublicVerificationStatusResult
  | {
      kind: "projection";
      projection: PublicWorkerVerificationProjection;
    };

export interface PublicVerificationRepositoryPort {
  consumeRateLimit(input: PublicVerificationRateLimitInput): Promise<number>;
  findPublicWorkerByPermanentId(
    workerId: string
  ): Promise<PublicWorkerVerificationSource | null>;
}

const HEX_64_PATTERN = /^[a-f0-9]{64}$/;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_LOOKUP_LIMIT = 30;
const IDENTIFIER_LOOKUP_LIMIT = 10;
const RESULT_LIMIT = 60;

const SAFE_MISS: PublicVerificationStatusResult = Object.freeze({
  kind: "status",
  status: "not_found_or_invalid"
});
const TEMPORARILY_UNAVAILABLE: PublicVerificationStatusResult = Object.freeze({
  kind: "status",
  status: "temporarily_unavailable"
});

function normalizeClock(now: Date): Date {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new Error("Public verification service clock is invalid.");
  }
  return now;
}

function normalizeRequestFingerprint(value: string): string {
  if (typeof value !== "string" || !HEX_64_PATTERN.test(value)) {
    throw new Error("Public verification request fingerprint is invalid.");
  }
  return value;
}

function rateInput(
  action: PublicVerificationRateLimitAction,
  bucketKey: string,
  now: Date
): PublicVerificationRateLimitInput {
  return {
    action,
    bucketKey,
    now: now.toISOString(),
    resetBefore: new Date(now.getTime() - RATE_LIMIT_WINDOW_MS).toISOString()
  };
}

export class PublicVerificationService {
  constructor(
    private readonly repository: PublicVerificationRepositoryPort,
    private readonly secret: string
  ) {
    if (typeof secret !== "string" || secret.length < 32) {
      throw new Error("Public verification service secret is invalid.");
    }
  }

  private async consume(
    action: PublicVerificationRateLimitAction,
    bucketKey: string,
    now: Date
  ): Promise<number | null> {
    try {
      return await this.repository.consumeRateLimit(
        rateInput(action, bucketKey, now)
      );
    } catch {
      return null;
    }
  }

  async lookupPublicVerification(input: {
    rawIdentifier: string;
    requestFingerprint: string;
    now?: Date;
  }): Promise<PublicVerificationLookupResult> {
    const now = normalizeClock(input.now ?? new Date());
    const requestFingerprint = normalizeRequestFingerprint(
      input.requestFingerprint
    );

    const requestCount = await this.consume(
      "lookup",
      requestFingerprint,
      now
    );
    if (requestCount === null || requestCount > REQUEST_LOOKUP_LIMIT) {
      return TEMPORARILY_UNAVAILABLE;
    }

    const identifier = normalizePublicVerificationIdentifier(
      input.rawIdentifier
    );
    if (!identifier) return SAFE_MISS;

    let identifierBucketKey: string;
    try {
      identifierBucketKey = publicVerificationIdentifierBucketKey(
        identifier.normalizedIdentifier,
        this.secret
      );
    } catch {
      return SAFE_MISS;
    }

    const identifierCount = await this.consume(
      "lookup",
      identifierBucketKey,
      now
    );
    if (identifierCount === null || identifierCount > IDENTIFIER_LOOKUP_LIMIT) {
      return TEMPORARILY_UNAVAILABLE;
    }

    if (identifier.kind !== "worker") return SAFE_MISS;

    let source: PublicWorkerVerificationSource | null;
    try {
      source = await this.repository.findPublicWorkerByPermanentId(
        identifier.normalizedIdentifier
      );
    } catch {
      return TEMPORARILY_UNAVAILABLE;
    }
    if (!source) return SAFE_MISS;

    if (
      mapWorkerIdentityStatusToPublicStatus(source.lifecycleStatus) ===
      "not_found_or_invalid"
    ) {
      return SAFE_MISS;
    }

    return {
      kind: "redirect",
      publicToken: mintPublicVerificationCapability(
        {
          identifierKind: "worker",
          normalizedIdentifier: identifier.normalizedIdentifier
        },
        this.secret,
        now
      )
    };
  }

  async resolvePublicVerificationCapability(input: {
    publicToken: string;
    requestFingerprint: string;
    now?: Date;
  }): Promise<PublicVerificationResolvedResult> {
    const now = normalizeClock(input.now ?? new Date());
    const requestFingerprint = normalizeRequestFingerprint(
      input.requestFingerprint
    );

    const resultCount = await this.consume("result", requestFingerprint, now);
    if (resultCount === null || resultCount > RESULT_LIMIT) {
      return TEMPORARILY_UNAVAILABLE;
    }

    const capability = verifyPublicVerificationCapability(
      input.publicToken,
      this.secret,
      now
    );
    if (!capability || capability.identifierKind !== "worker") {
      return SAFE_MISS;
    }

    let source: PublicWorkerVerificationSource | null;
    try {
      source = await this.repository.findPublicWorkerByPermanentId(
        capability.normalizedIdentifier
      );
    } catch {
      return TEMPORARILY_UNAVAILABLE;
    }
    if (!source) return SAFE_MISS;

    if (
      mapWorkerIdentityStatusToPublicStatus(source.lifecycleStatus) ===
      "not_found_or_invalid"
    ) {
      return SAFE_MISS;
    }

    return {
      kind: "projection",
      projection: projectPublicWorkerVerification(source, now.toISOString())
    };
  }
}