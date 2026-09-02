import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

async function loadStandaloneTypeScriptModule(path) {
  const source = await readFile(resolve(path), "utf8").catch(() => "");
  assert.ok(source.trim(), `${path} is missing`);
  const testable = source.replace(/^import\s+["']server-only["'];?\s*$/gm, "");
  const output = ts.transpileModule(testable, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true
    },
    fileName: path
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

function event(sequenceNo, signal, source = "BROWSER") {
  return Object.freeze({ sequenceNo, signal, source });
}

test("M2.09 policy is versioned, server-only, advisory, and never treats degraded evidence as clean", async () => {
  const policy = await loadStandaloneTypeScriptModule(
    "src/lib/assessment-integrity/assessment-integrity-policy.ts"
  );

  assert.equal(typeof policy.INTEGRITY_POLICY_VERSION, "string");
  assert.match(policy.INTEGRITY_POLICY_VERSION, /^m2\.09-[a-z0-9.-]+$/);

  assert.deepEqual(policy.evaluateIntegrityEvidence([event(1, "SESSION_STARTED", "SYSTEM")]), {
    policyVersion: policy.INTEGRITY_POLICY_VERSION,
    classification: "GREEN",
    monitoringState: "NORMAL",
    warningKeys: []
  });

  for (const degradedSignal of [
    "MEDIA_PERMISSION_DENIED",
    "MEDIA_TRACK_ENDED",
    "PROVIDER_DEGRADED"
  ]) {
    const result = policy.evaluateIntegrityEvidence([
      event(1, "SESSION_STARTED", "SYSTEM"),
      event(2, degradedSignal, degradedSignal === "PROVIDER_DEGRADED" ? "PROVIDER" : "BROWSER")
    ]);
    assert.equal(result.monitoringState, "DEGRADED", degradedSignal);
    assert.notEqual(result.classification, "GREEN", degradedSignal);
    assert.ok(result.warningKeys.includes("monitoring_degraded"), degradedSignal);
    assert.equal("outcome" in result, false);
    assert.equal("invalidate" in result, false);
    assert.equal("score" in result, false);
  }
});

test("M2.09 policy escalates review evidence without emitting a final assessment decision", async () => {
  const policy = await loadStandaloneTypeScriptModule(
    "src/lib/assessment-integrity/assessment-integrity-policy.ts"
  );

  for (const yellowSignal of [
    "TAB_HIDDEN",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "WEBCAM_ABSENT"
  ]) {
    const result = policy.evaluateIntegrityEvidence([
      event(1, "SESSION_STARTED", "SYSTEM"),
      event(2, yellowSignal)
    ]);
    assert.equal(result.classification, "YELLOW", yellowSignal);
  }

  for (const redSignal of [
    "MULTIPLE_FACE_DETECTED",
    "ADDITIONAL_VOICE_DETECTED",
    "DEVICE_CHANGED"
  ]) {
    const result = policy.evaluateIntegrityEvidence([
      event(1, "SESSION_STARTED", "SYSTEM"),
      event(2, redSignal, redSignal === "DEVICE_CHANGED" ? "SYSTEM" : "PROVIDER")
    ]);
    assert.equal(result.classification, "RED", redSignal);
    assert.equal("passed" in result, false);
    assert.equal("failed" in result, false);
    assert.equal("invalidated" in result, false);
  }
});

test("monitoring recovery can restore current health without erasing historical review concern", async () => {
  const policy = await loadStandaloneTypeScriptModule(
    "src/lib/assessment-integrity/assessment-integrity-policy.ts"
  );

  const recoveredCamera = policy.evaluateIntegrityEvidence([
    event(1, "SESSION_STARTED", "SYSTEM"),
    event(2, "MEDIA_TRACK_ENDED"),
    event(3, "WEBCAM_PRESENT")
  ]);
  assert.equal(recoveredCamera.monitoringState, "NORMAL");
  assert.equal(recoveredCamera.classification, "YELLOW");

  const recoveredProvider = policy.evaluateIntegrityEvidence([
    event(1, "SESSION_STARTED", "SYSTEM"),
    event(2, "PROVIDER_DEGRADED", "PROVIDER"),
    event(3, "IDENTITY_RECONFIRMED", "PROVIDER")
  ]);
  assert.equal(recoveredProvider.monitoringState, "NORMAL");
  assert.equal(recoveredProvider.classification, "YELLOW");
});

test("metadata normalization is fixed-key, bounded and rejects secrets, answers, raw media and unrestricted objects", async () => {
  const policy = await loadStandaloneTypeScriptModule(
    "src/lib/assessment-integrity/assessment-integrity-policy.ts"
  );

  assert.deepEqual(
    policy.normalizeIntegrityMetadata({
      capability: "camera",
      state: "active",
      category: "camera",
      reason: "track_started",
      note: "Camera recovered after reconnect.",
      online: true
    }),
    {
      capability: "camera",
      state: "active",
      category: "camera",
      reason: "track_started",
      note: "Camera recovered after reconnect.",
      online: true
    }
  );

  for (const unsafe of [
    { token: "secret" },
    { authorization: "Bearer secret" },
    { cookie: "session=secret" },
    { credential: "secret" },
    { password: "secret" },
    { answer: "candidate response" },
    { answerBody: "candidate response" },
    { rawMedia: "AAAA" },
    { video: "AAAA" },
    { audio: "AAAA" },
    { screenCapture: "AAAA" },
    { dom: "<html>...</html>" },
    { error: { stack: "unbounded" } },
    { unknownDiagnostic: "anything" }
  ]) {
    assert.throws(() => policy.normalizeIntegrityMetadata(unsafe), /metadata|diagnostic|allowed|unsafe/i);
  }

  assert.throws(
    () => policy.normalizeIntegrityMetadata({ note: "x".repeat(1001) }),
    /metadata|note|long|invalid/i
  );
  assert.throws(
    () => policy.normalizeIntegrityMetadata({ reason: "x".repeat(201) }),
    /metadata|reason|long|invalid/i
  );
  assert.throws(
    () => policy.normalizeIntegrityMetadata({ capability: { nested: true } }),
    /metadata|primitive|invalid/i
  );
});

test("provider adapter normalizes trusted observations and malformed/provider failures become degraded evidence", async () => {
  const provider = await loadStandaloneTypeScriptModule(
    "src/lib/assessment-integrity/assessment-integrity-provider.ts"
  );

  assert.deepEqual(provider.normalizeIntegrityProviderObservation({ kind: "IDENTITY_RECONFIRMED" }), {
    signal: "IDENTITY_RECONFIRMED",
    metadata: { capability: "identity", state: "available" }
  });
  assert.deepEqual(provider.normalizeIntegrityProviderObservation({ kind: "FACE_STATUS", status: "MULTIPLE" }), {
    signal: "MULTIPLE_FACE_DETECTED",
    metadata: { capability: "camera", state: "active" }
  });
  assert.deepEqual(provider.normalizeIntegrityProviderObservation({ kind: "VOICE_STATUS", status: "ADDITIONAL" }), {
    signal: "ADDITIONAL_VOICE_DETECTED",
    metadata: { capability: "voice", state: "active" }
  });

  for (const input of [
    { kind: "UNAVAILABLE", reason: "timeout" },
    { kind: "FACE_STATUS", status: "UNKNOWN" },
    { arbitrary: { raw: "provider-object" } },
    null
  ]) {
    const normalized = provider.normalizeIntegrityProviderObservation(input);
    assert.equal(normalized.signal, "PROVIDER_DEGRADED");
    assert.equal(normalized.metadata.capability, "provider");
    assert.equal(Object.hasOwn(normalized, "raw"), false);
    assert.equal(Object.hasOwn(normalized.metadata, "raw"), false);
  }
});
