import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { normalizePublicVerificationIdentifier } from "@/lib/public-verification/public-verification-domain";

export type PublicVerificationRequestMetadata = {
  ipAddress: string | null;
  userAgent: string | null;
};

const MIN_SECRET_LENGTH = 32;
const MAX_IP_LENGTH = 128;
const MAX_USER_AGENT_LENGTH = 512;
const REQUEST_CONTEXT = "hseverify:m1.12:public-request-fingerprint:v1";
const IDENTIFIER_CONTEXT = "hseverify:m1.12:public-identifier-bucket:v1";

export function publicVerificationMetadataFromHeaders(
  headers: Pick<Headers, "get">,
  trustedIpHeader: string | null = null
): PublicVerificationRequestMetadata {
  // Forwarding headers are not authenticated by Next.js. Only consume a single
  // address from an explicitly configured, overwriting private ingress.
  const candidate = trustedIpHeader ? headers.get(trustedIpHeader)?.trim() : null;
  let ipAddress: string | null = null;
  if (candidate && candidate.length <= MAX_IP_LENGTH) {
    const version = isIP(candidate);
    if (version === 4) ipAddress = candidate;
    if (version === 6 && !candidate.includes("%")) {
      ipAddress = new URL(`http://[${candidate}]`).hostname.slice(1, -1);
    }
  }
  const userAgent = headers.get("user-agent")
    ?.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_USER_AGENT_LENGTH) || null;
  return { ipAddress, userAgent };
}

function assertSecret(secret: string): void {
  if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
    throw new Error("Public verification request secret is invalid.");
  }
}

function normalizeMetadataValue(
  value: string | null,
  maximumLength: number,
  label: string
): string {
  if (value === null) return "unknown";
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error(`${label} is invalid.`);
  }
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maximumLength) {
    throw new Error(`${label} is invalid.`);
  }
  return normalized;
}

function digest(secret: string, context: string, value: string): string {
  assertSecret(secret);
  return createHmac("sha256", secret)
    .update(context, "utf8")
    .update("\0", "utf8")
    .update(value, "utf8")
    .digest("hex");
}

export function publicVerificationRequestFingerprint(
  metadata: PublicVerificationRequestMetadata,
  secret: string
): string {
  const ipAddress = normalizeMetadataValue(
    metadata.ipAddress,
    MAX_IP_LENGTH,
    "Public verification IP metadata"
  );
  normalizeMetadataValue(
    metadata.userAgent,
    MAX_USER_AGENT_LENGTH,
    "Public verification user-agent metadata"
  );
  // User-Agent is caller-controlled. Including it lets one client create an
  // unlimited number of independent lookup, result and concern budgets.
  return digest(secret, REQUEST_CONTEXT, ipAddress);
}

export function publicVerificationIdentifierBucketKey(
  normalizedIdentifier: string,
  secret: string
): string {
  const identifier = normalizePublicVerificationIdentifier(normalizedIdentifier);
  if (!identifier || identifier.normalizedIdentifier !== normalizedIdentifier) {
    throw new Error("Public verification identifier bucket input is invalid.");
  }
  return digest(
    secret,
    IDENTIFIER_CONTEXT,
    `${identifier.kind}:${identifier.normalizedIdentifier}`
  );
}
