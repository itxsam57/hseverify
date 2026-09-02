import { createIdentifier } from "../auth/auth-domain";

export const INTEGRITY_SESSION_STATUSES = Object.freeze([
  "ACTIVE",
  "ENDED"
] as const);
export type IntegritySessionStatus = (typeof INTEGRITY_SESSION_STATUSES)[number];

export const INTEGRITY_CLASSIFICATIONS = Object.freeze([
  "GREEN",
  "YELLOW",
  "RED"
] as const);
export type IntegrityClassification = (typeof INTEGRITY_CLASSIFICATIONS)[number];

export const INTEGRITY_MONITORING_STATES = Object.freeze([
  "NORMAL",
  "DEGRADED"
] as const);
export type IntegrityMonitoringState = (typeof INTEGRITY_MONITORING_STATES)[number];

export const INTEGRITY_EVENT_SOURCES = Object.freeze([
  "BROWSER",
  "PROVIDER",
  "SYSTEM"
] as const);
export type IntegrityEventSource = (typeof INTEGRITY_EVENT_SOURCES)[number];

export const INTEGRITY_SIGNALS = Object.freeze([
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
] as const);
export type IntegritySignal = (typeof INTEGRITY_SIGNALS)[number];

export type AssessmentIntegritySessionRecord = Readonly<{
  integritySessionId: string;
  attemptId: string;
  workerAccountId: string;
  formId: string;
  policyVersion: string;
  status: IntegritySessionStatus;
  classification: IntegrityClassification;
  monitoringState: IntegrityMonitoringState;
  deviceBindingDigest: string;
  leaseDigest: string;
  leaseExpiresAt: string;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type AssessmentIntegrityEventRecord = Readonly<{
  eventId: string;
  integritySessionId: string;
  attemptId: string;
  sequenceNo: number;
  idempotencyKey: string;
  payloadDigest: string;
  source: IntegrityEventSource;
  signal: IntegritySignal;
  observedAt: string | null;
  receivedAt: string;
  metadata: Readonly<Record<string, unknown>>;
}>;

export class AssessmentIntegrityInputError extends Error {
  constructor(message = "Assessment integrity input is invalid.") {
    super(message);
    this.name = "AssessmentIntegrityInputError";
  }
}

export class AssessmentIntegrityAccessError extends Error {
  constructor(message = "Assessment integrity session could not be accessed.") {
    super(message);
    this.name = "AssessmentIntegrityAccessError";
  }
}

export class AssessmentIntegrityConflictError extends Error {
  constructor(message = "Assessment integrity session changed. Reload and try again.") {
    super(message);
    this.name = "AssessmentIntegrityConflictError";
  }
}

export const createIntegritySessionId = (): string =>
  createIdentifier("integrity_session");

export const createIntegrityEventId = (): string =>
  createIdentifier("integrity_event");

export function isIntegritySessionStatus(value: unknown): value is IntegritySessionStatus {
  return (
    typeof value === "string" &&
    INTEGRITY_SESSION_STATUSES.includes(value as IntegritySessionStatus)
  );
}

export function isIntegrityClassification(value: unknown): value is IntegrityClassification {
  return (
    typeof value === "string" &&
    INTEGRITY_CLASSIFICATIONS.includes(value as IntegrityClassification)
  );
}

export function isIntegrityMonitoringState(value: unknown): value is IntegrityMonitoringState {
  return (
    typeof value === "string" &&
    INTEGRITY_MONITORING_STATES.includes(value as IntegrityMonitoringState)
  );
}

export function isIntegrityEventSource(value: unknown): value is IntegrityEventSource {
  return (
    typeof value === "string" &&
    INTEGRITY_EVENT_SOURCES.includes(value as IntegrityEventSource)
  );
}

export function isIntegritySignal(value: unknown): value is IntegritySignal {
  return typeof value === "string" && INTEGRITY_SIGNALS.includes(value as IntegritySignal);
}
