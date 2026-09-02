import "server-only";

import type { IntegritySignal } from "./assessment-integrity-domain";

export type IntegrityProviderNormalizedObservation = Readonly<{
  signal: IntegritySignal;
  metadata: Readonly<Record<string, string>>;
}>;

type ProviderObservation =
  | Readonly<{ kind: "IDENTITY_RECONFIRMED" }>
  | Readonly<{ kind: "FACE_STATUS"; status: "PRESENT" | "ABSENT" | "MULTIPLE" }>
  | Readonly<{ kind: "VOICE_STATUS"; status: "SINGLE" | "ADDITIONAL" | "INTERRUPTED" }>
  | Readonly<{ kind: "UNAVAILABLE"; reason?: string }>;

function degraded(reason: string): IntegrityProviderNormalizedObservation {
  return Object.freeze({
    signal: "PROVIDER_DEGRADED",
    metadata: Object.freeze({ capability: "provider", state: "unavailable", reason })
  });
}

export function normalizeIntegrityProviderObservation(
  input: unknown
): IntegrityProviderNormalizedObservation {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return degraded("malformed_provider_output");
  }

  const observation = input as Partial<ProviderObservation> & Record<string, unknown>;

  if (observation.kind === "IDENTITY_RECONFIRMED") {
    return Object.freeze({
      signal: "IDENTITY_RECONFIRMED",
      metadata: Object.freeze({ capability: "identity", state: "available" })
    });
  }

  if (observation.kind === "FACE_STATUS") {
    if (observation.status === "PRESENT") {
      return Object.freeze({
        signal: "WEBCAM_PRESENT",
        metadata: Object.freeze({ capability: "camera", state: "active" })
      });
    }
    if (observation.status === "ABSENT") {
      return Object.freeze({
        signal: "WEBCAM_ABSENT",
        metadata: Object.freeze({ capability: "camera", state: "inactive" })
      });
    }
    if (observation.status === "MULTIPLE") {
      return Object.freeze({
        signal: "MULTIPLE_FACE_DETECTED",
        metadata: Object.freeze({ capability: "camera", state: "active" })
      });
    }
    return degraded("malformed_provider_output");
  }

  if (observation.kind === "VOICE_STATUS") {
    if (observation.status === "ADDITIONAL") {
      return Object.freeze({
        signal: "ADDITIONAL_VOICE_DETECTED",
        metadata: Object.freeze({ capability: "voice", state: "active" })
      });
    }
    if (observation.status === "INTERRUPTED") {
      return Object.freeze({
        signal: "MICROPHONE_INTERRUPTED",
        metadata: Object.freeze({ capability: "voice", state: "inactive" })
      });
    }
    if (observation.status === "SINGLE") {
      return Object.freeze({
        signal: "HEARTBEAT",
        metadata: Object.freeze({ capability: "voice", state: "available" })
      });
    }
    return degraded("malformed_provider_output");
  }

  if (observation.kind === "UNAVAILABLE") {
    return degraded("provider_unavailable");
  }

  return degraded("malformed_provider_output");
}
