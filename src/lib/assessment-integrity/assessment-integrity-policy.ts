import "server-only";

import type {
  IntegrityClassification,
  IntegrityEventSource,
  IntegrityMonitoringState,
  IntegritySignal
} from "./assessment-integrity-domain";

export const INTEGRITY_POLICY_VERSION = "m2.09-integrity-v1" as const;

export type IntegrityPolicyEvidence = Readonly<{
  sequenceNo: number;
  signal: IntegritySignal;
  source: IntegrityEventSource;
}>;

export type IntegrityWarningKey =
  | "monitoring_degraded"
  | "integrity_attention"
  | "integrity_review_required";

export type IntegrityPolicyDecision = Readonly<{
  policyVersion: typeof INTEGRITY_POLICY_VERSION;
  classification: IntegrityClassification;
  monitoringState: IntegrityMonitoringState;
  warningKeys: readonly IntegrityWarningKey[];
}>;

type SafeMetadataPrimitive = string | number | boolean | null;
export type NormalizedIntegrityMetadata = Readonly<
  Record<string, SafeMetadataPrimitive>
>;

const RED_SIGNALS = new Set<IntegritySignal>([
  "MULTIPLE_FACE_DETECTED",
  "ADDITIONAL_VOICE_DETECTED",
  "DEVICE_CHANGED"
]);

const YELLOW_SIGNALS = new Set<IntegritySignal>([
  "TAB_HIDDEN",
  "WINDOW_BLUR",
  "FULLSCREEN_EXIT",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "WEBCAM_ABSENT",
  "MICROPHONE_INTERRUPTED",
  "SCREEN_SHARE_STOPPED",
  "CONNECTION_LOST",
  "MEDIA_PERMISSION_DENIED",
  "MEDIA_TRACK_MUTED",
  "MEDIA_TRACK_ENDED",
  "PROVIDER_DEGRADED",
  "TECHNICAL_REPORT",
  "EMERGENCY_EXIT"
]);

const SAFE_METADATA_KEYS = new Set([
  "capability",
  "state",
  "category",
  "reason",
  "note",
  "online",
  "fullscreen",
  "visible",
  "focused",
  "muted",
  "trackKind",
  "provider"
]);

const FORBIDDEN_METADATA_KEY =
  /(password|passcode|otp|token|secret|cookie|authorization|csrf|credential|answer|raw.?media|video|audio|screen.?capture|dom|error)/i;

const MAX_METADATA_BYTES = 4_096;
const MAX_NOTE_CODE_POINTS = 1_000;
const MAX_REASON_CODE_POINTS = 200;
const MAX_GENERAL_STRING_CODE_POINTS = 120;

function orderedEvidence(
  evidence: readonly IntegrityPolicyEvidence[]
): readonly IntegrityPolicyEvidence[] {
  return [...evidence].sort((left, right) => left.sequenceNo - right.sequenceNo);
}

function currentMonitoringState(
  evidence: readonly IntegrityPolicyEvidence[]
): IntegrityMonitoringState {
  let browserMediaDegraded = false;
  let screenDegraded = false;
  let providerDegraded = false;
  let connectionDegraded = false;

  for (const item of orderedEvidence(evidence)) {
    if (item.signal === "MEDIA_PERMISSION_DENIED" || item.signal === "MEDIA_TRACK_ENDED") {
      browserMediaDegraded = true;
      continue;
    }
    if (item.signal === "WEBCAM_PRESENT") {
      browserMediaDegraded = false;
      if (item.source === "PROVIDER") providerDegraded = false;
      continue;
    }
    if (item.signal === "SCREEN_SHARE_STOPPED") {
      screenDegraded = true;
      continue;
    }
    if (item.signal === "SCREEN_SHARE_STARTED") {
      screenDegraded = false;
      continue;
    }
    if (item.signal === "PROVIDER_DEGRADED") {
      providerDegraded = true;
      continue;
    }
    if (item.source === "PROVIDER" && item.signal === "IDENTITY_RECONFIRMED") {
      providerDegraded = false;
      continue;
    }
    if (item.signal === "CONNECTION_LOST") {
      connectionDegraded = true;
      continue;
    }
    if (item.signal === "CONNECTION_RESTORED") {
      connectionDegraded = false;
    }
  }

  return browserMediaDegraded || screenDegraded || providerDegraded || connectionDegraded
    ? "DEGRADED"
    : "NORMAL";
}

export function evaluateIntegrityEvidence(
  evidence: readonly IntegrityPolicyEvidence[]
): IntegrityPolicyDecision {
  const monitoringState = currentMonitoringState(evidence);
  let classification: IntegrityClassification = "GREEN";
  let hadDegradedEvidence = false;

  for (const item of evidence) {
    if (
      item.signal === "MEDIA_PERMISSION_DENIED" ||
      item.signal === "MEDIA_TRACK_ENDED" ||
      item.signal === "SCREEN_SHARE_STOPPED" ||
      item.signal === "PROVIDER_DEGRADED" ||
      item.signal === "CONNECTION_LOST"
    ) {
      hadDegradedEvidence = true;
    }
    if (RED_SIGNALS.has(item.signal)) {
      classification = "RED";
      continue;
    }
    if (classification === "GREEN" && YELLOW_SIGNALS.has(item.signal)) {
      classification = "YELLOW";
    }
  }

  if (classification === "GREEN" && (monitoringState === "DEGRADED" || hadDegradedEvidence)) {
    classification = "YELLOW";
  }

  const warningKeys: IntegrityWarningKey[] = [];
  if (monitoringState === "DEGRADED") {
    warningKeys.push("monitoring_degraded");
  }
  if (classification === "RED") {
    warningKeys.push("integrity_review_required");
  } else if (classification === "YELLOW" && monitoringState !== "DEGRADED") {
    warningKeys.push("integrity_attention");
  }

  return Object.freeze({
    policyVersion: INTEGRITY_POLICY_VERSION,
    classification,
    monitoringState,
    warningKeys: Object.freeze(warningKeys)
  });
}

function codePointLength(value: string): number {
  return [...value].length;
}

function normalizeMetadataPrimitive(
  key: string,
  value: unknown
): SafeMetadataPrimitive {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Integrity metadata number is invalid.");
    }
    return value;
  }
  if (typeof value !== "string") {
    throw new Error("Integrity metadata values must be primitive diagnostics.");
  }

  const maximum =
    key === "note"
      ? MAX_NOTE_CODE_POINTS
      : key === "reason"
        ? MAX_REASON_CODE_POINTS
        : MAX_GENERAL_STRING_CODE_POINTS;
  if (codePointLength(value) > maximum) {
    throw new Error(`Integrity metadata ${key} is too long.`);
  }
  return value;
}

export function normalizeIntegrityMetadata(
  input: unknown
): NormalizedIntegrityMetadata {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input)
  ) {
    throw new Error("Integrity metadata must be a diagnostic object.");
  }

  const normalized: Record<string, SafeMetadataPrimitive> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_METADATA_KEY.test(key)) {
      throw new Error("Unsafe integrity metadata key is not allowed.");
    }
    if (!SAFE_METADATA_KEYS.has(key)) {
      throw new Error("Integrity metadata key is not allowed.");
    }
    normalized[key] = normalizeMetadataPrimitive(key, value);
  }

  if (Buffer.byteLength(JSON.stringify(normalized), "utf8") > MAX_METADATA_BYTES) {
    throw new Error("Integrity metadata is too large.");
  }

  return Object.freeze(normalized);
}
