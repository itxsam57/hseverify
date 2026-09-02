# M2.09 Integrity Engine — Approved Design

**Status:** OWNER APPROVED  
**Architecture:** A — Server-authoritative Integrity Session + immutable event ledger  
**Mode:** Controlled Web Mode  
**Approved:** 2026-09-02  
**Verified starting `main`:** `5ebcad624f6dec4aa8562249be0c90cd4f8cec4e`

## 1. Goal

M2.09 adds the integrity evidence layer for an active Worker assessment without reopening the accepted M2.08 answer-recovery lifecycle and without implementing M2.10 scoring/review decisions.

Canonical completion requirement: camera/microphone/screen/browser events, Green/Yellow/Red advisory classifications, explicit degraded-monitoring behavior, and a safe evidence timeline.

The Integrity Engine records and evaluates evidence. It does **not** decide whether an assessment is valid, passed, failed, invalidated, or accepted.

## 2. Locked scope boundary

M2.09 owns:

- one integrity session associated with one existing assessment attempt;
- privacy-preserving device/session binding and an expiring active lease;
- normalized browser, media, provider and system integrity signals;
- immutable, idempotent event persistence with server-authoritative receipt ordering;
- a versioned server-side integrity policy;
- advisory `GREEN | YELLOW | RED` classification;
- `NORMAL | DEGRADED` monitoring state;
- safe candidate warnings where policy requires them;
- camera, microphone and display-capture permission/track-health monitoring in Controlled Web Mode;
- focus/visibility/fullscreen/copy/paste/connectivity monitoring;
- assessment-scoped technical reports with bounded safe diagnostics;
- Emergency Exit and assessment submission integrity-session closure semantics;
- a safe chronological evidence projection consumable by the later Review Engine;
- permanent contract/runtime/browser/security/regression verification.

M2.09 does **not** own:

- correctness scoring, rubric scoring, written-answer scoring or pass/fail;
- reviewer allocation, review decisions or final integrity dispositions;
- automatic assessment invalidation;
- transition to a M2.10 review outcome;
- retakes/reassessment orchestration;
- interview scheduling or interview decisions;
- credentials;
- locked-workstation, kiosk, SEB or managed-device enforcement;
- hardware fingerprinting;
- raw webcam, microphone or screen recordings in relational storage;
- AI-only or detector-only high-stakes decisions.

## 3. Existing lifecycle remains authoritative

`assessment_attempts` remains the M2.07/M2.08 attempt authority and its status vocabulary remains exactly:

```text
IN_PROGRESS | SUBMITTED
```

M2.09 must not add integrity states to that table. Integrity lifecycle is separate so provider/browser degradation cannot corrupt the core attempt or answer-recovery state.

`assessment_attempt_answers` remains immutable committed-answer history. `assessment_attempt_drafts` remains the mutable current-answer draft only. Integrity events must never contain answer bodies.

## 4. Data model

### 4.1 `assessment_integrity_sessions`

One row maximum per assessment attempt.

Required authority/lineage:

- `integrity_session_id` — server-generated identifier;
- `attempt_id` — unique FK to the existing attempt;
- `worker_account_id` — locked Worker lineage;
- `form_id` — locked generated-form lineage;
- `policy_version` — frozen effective integrity-policy version;
- `status` — `ACTIVE | ENDED`;
- `classification` — current derived `GREEN | YELLOW | RED`;
- `monitoring_state` — `NORMAL | DEGRADED`;
- `device_binding_digest` — SHA-256 digest only;
- `lease_digest` — SHA-256 digest only;
- `lease_expires_at`;
- `started_at`, `last_seen_at`, nullable `ended_at`, `created_at`, `updated_at`.

The raw device nonce, raw lease token, authentication secret, media stream and hardware fingerprint are never persisted.

The binding digest is derived server-side from trusted authorization-session context plus a bounded cryptographically random assessment device nonce supplied by the browser. The design intentionally avoids passive hardware/browser fingerprinting.

### 4.2 `assessment_integrity_events`

Append-only evidence ledger.

Required fields:

- server-generated `event_id`;
- `integrity_session_id` and `attempt_id` lineage;
- monotonically increasing server-assigned `sequence_no` per integrity session;
- bounded `idempotency_key` and SHA-256 `payload_digest`;
- `source` — `BROWSER | PROVIDER | SYSTEM`;
- fixed normalized `signal_key` vocabulary;
- nullable bounded client/provider observation time for diagnostics;
- authoritative `received_at` server time;
- bounded JSON metadata containing only allowlisted non-secret diagnostics.

Unique constraints prevent duplicate sequence numbers and duplicate idempotency keys within a session. Reusing an idempotency key with a different payload fails closed.

Database guards reject UPDATE/DELETE of integrity events. Rollback may remove M2.09-owned tables but normal runtime code cannot mutate historical evidence.

## 5. Normalized signal vocabulary

The initial fixed vocabulary includes the master-spec signals while separating browser-observable and provider-only authority:

```text
SESSION_STARTED
HEARTBEAT
IDENTITY_RECONFIRMED
WEBCAM_PRESENT
WEBCAM_ABSENT
MULTIPLE_FACE_DETECTED
MICROPHONE_INTERRUPTED
ADDITIONAL_VOICE_DETECTED
SCREEN_SHARE_STARTED
SCREEN_SHARE_STOPPED
TAB_HIDDEN
TAB_VISIBLE
WINDOW_BLUR
WINDOW_FOCUS
FULLSCREEN_EXIT
FULLSCREEN_ENTER
COPY_ATTEMPT
PASTE_ATTEMPT
CONNECTION_LOST
CONNECTION_RESTORED
MEDIA_PERMISSION_DENIED
MEDIA_TRACK_MUTED
MEDIA_TRACK_ENDED
PROVIDER_DEGRADED
DEVICE_CHANGED
TECHNICAL_REPORT
EMERGENCY_EXIT
SESSION_ENDED
```

Browser ingestion is allowlisted to browser-observable signals. It cannot self-report trusted face/voice/liveness/provider detections or server lifecycle events.

Provider adapter output is also normalized server-side before persistence. Provider payloads are never stored wholesale.

## 6. Versioned policy and classification

The effective policy is server-only and versioned. M2.09 starts with one immutable policy version and an evaluator that consumes persisted normalized evidence.

Public classification vocabulary:

- **Green** — no material concern in the evidence available;
- **Yellow** — human review required;
- **Red** — serious concern, identity issue, prohibited behavior or insufficient evidence.

Classification is advisory evidence only. `RED` must never automatically submit, invalidate, fail or cancel an assessment.

The browser never supplies `classification`, `monitoringState`, severity, policy version, score, threshold, Worker id, form id or case id as trusted authority. Those values are resolved or derived server-side.

Exact detector thresholds, weighting and proprietary policy details stay server-side. Candidate warnings communicate the prohibited/problematic action in safe language without exposing those internals.

## 7. Degraded monitoring

Monitoring failure is evidence, not absence of evidence.

Any required provider failure, denied/revoked required media permission, ended required capture track, unsupported monitoring capability, or material telemetry gap enters explicit `DEGRADED` state according to the frozen policy.

A session must never remain or return `GREEN` merely because a required detector/provider is unavailable. The evaluator must conservatively derive at least the policy-required human-review classification when evidence sufficiency is degraded.

Recovery can restore `monitoring_state=NORMAL` only when the required capability is demonstrably healthy again. Historical degraded events remain immutable.

## 8. Device/session lease authority

The authenticated Worker principal and its trusted authorization `sessionId` remain server authority.

At integrity-session start/resume:

1. service re-resolves the owned `IN_PROGRESS` attempt;
2. service receives a bounded random assessment device nonce from the controlled browser session;
3. server hashes trusted auth-session id + device nonce and persists only the digest;
4. server issues/rotates an opaque lease token and persists only its digest;
5. subsequent event batches must match the active trusted session/device binding and lease;
6. one active binding is authoritative at a time;
7. concurrent/mismatched device use fails closed and records safe `DEVICE_CHANGED`/degraded evidence where the legitimate server path can establish it.

Lease expiry allows explicit re-establishment by the owning Worker under policy, rather than permanent lockout after crashes.

## 9. Browser monitor

The Worker assessment workspace gets a dedicated M2.09 monitor that:

- performs an explicit monitoring/preflight consent boundary before starting required media capture;
- requests camera and microphone access;
- requests display capture using the browser-supported screen-share API;
- watches media track mute/end state;
- watches `visibilitychange`, focus/blur, fullscreen changes, copy/paste, online/offline;
- emits bounded event batches and heartbeat observations with per-event idempotency keys;
- receives only safe server-derived status/warning output;
- cleans up listeners/tracks on exit or submission;
- never attempts to make the browser literally uncloseable;
- never steals focus in a loop;
- always preserves the explicit Emergency Exit.

Controlled Web Mode can observe and warn about browser behavior but cannot promise OS-level lockdown. That limitation must remain truthful in UI copy and engineering evidence.

## 10. Candidate technical report

`Report technical issue` is assessment-scoped M2.09 evidence, not a general support-ticket subsystem.

The candidate may submit:

- one fixed category;
- a bounded plain-text note;
- safe allowlisted diagnostics such as online state, media track state, fullscreen state and browser capability booleans.

No answer body, cookie, token, authorization header, raw user-agent fingerprint, raw media, DOM dump or unrestricted error object may be accepted into integrity metadata.

Submitting a technical report does not silently pause or extend assessment time.

## 11. Emergency Exit and submission

Emergency Exit remains an escape hatch.

Before navigation the client performs best-effort current-answer persistence using the already-accepted M2.08 behavior, then best-effort records `EMERGENCY_EXIT` / integrity-session end. Failure to report integrity telemetry must never trap the Worker in the assessment.

Final assessment submission closes the active integrity session server-side as `ENDED` in the same authoritative flow where practical, but it does not create a score, pass/fail result or review disposition.

The existing M2.08 answer recovery guarantee remains unchanged: only server-confirmed saved answer state is guaranteed recoverable.

## 12. Evidence projection

M2.09 provides a server-safe evidence timeline ordered by server sequence/receipt time. Projection includes only:

- normalized signal label;
- source category;
- server receipt time;
- safe observation time when useful;
- bounded allowlisted details;
- derived classification/monitoring state snapshots or current rollup as appropriate.

It does not expose raw provider payloads, hidden thresholds, secrets, media, answer content or unrestricted client diagnostics.

M2.10 may consume this projection for assigned human review. M2.09 does not add reviewer decision controls.

## 13. Audit boundary

Generic platform audit records only material integrity lifecycle/governance actions, for example integrity session start/end and assessment-scoped technical report receipt if needed for traceability.

High-volume focus/visibility/heartbeat/media telemetry stays in the integrity event ledger and is not duplicated into generic audit metadata.

Generic audit metadata must remain answer-free, media-free and secret-free.

## 14. Provider adapters

Face-presence/multiple-face, additional-voice and liveness intelligence are represented behind server-side adapter interfaces.

M2.09 may ship a deterministic sandbox/test adapter and normalized provider contracts. No production provider may become a high-stakes decision maker. Provider unavailability or malformed output enters degraded mode; it cannot be interpreted as clean evidence.

## 15. Security/privacy invariants

- live Worker identity always comes from the trusted principal;
- browser ids are stale/idempotency/binding inputs only, never ownership authority;
- no raw video/audio/screen capture bytes in relational tables;
- no hardware fingerprinting;
- no answer content in integrity events/audit/logs;
- no authentication/session/lease secret persisted in plaintext;
- event metadata uses a fixed allowlist and strict byte/depth/string bounds;
- unknown signal/source combinations fail closed;
- event receipt and ordering are server authoritative;
- duplicate retries are idempotent and conflicting replays fail closed;
- event rows are immutable;
- provider failure becomes degraded evidence;
- integrity classification cannot mutate core attempt outcome.

## 16. Verification contract

M2.09 cannot be accepted without fresh proof for:

- migration apply/rollback/reapply;
- immutable event ledger;
- owned active-session start/resume;
- device/lease mismatch and concurrency rejection;
- idempotent event ingestion and conflicting replay rejection;
- browser attempt to spoof classification/policy/Worker/form authority being ignored/rejected;
- source/signal allowlist enforcement;
- safe metadata rejection of secrets/raw media/oversize payloads;
- policy classification and degraded-mode behavior;
- provider failure cannot yield a false clean result;
- evidence timeline order/secrecy;
- workspace monitoring, safe warnings, technical report and Emergency Exit behavior;
- real Chromium focus/visibility/fullscreen/copy/paste/connectivity/media-permission/track scenarios supported by CI;
- inherited M2.05–M2.08 regressions;
- strict TypeScript, lint, production dependency audit, build, Full Engineering and Independent full-system audit on the exact acceptance head.

## 17. Definition of done

M2.09 is complete only when the approved Controlled Web Mode architecture is implemented and independently verified with no critical/high defect, no M2.10 decision scope, no automatic invalidation, no hidden browser authority, and no regression of the accepted M2.08 recovery flow.