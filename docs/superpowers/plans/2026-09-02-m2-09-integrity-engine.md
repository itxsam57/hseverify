# M2.09 Integrity Engine Implementation Plan

> **Execution contract:** execute task-by-task with Superpowers `executing-plans` and strict `test-driven-development`. No production behavior is written before its RED test is committed and proven to fail for the expected missing-behavior reason.

**Status:** READY FOR IMPLEMENTATION  
**Goal:** implement the owner-approved server-authoritative Controlled Web Mode integrity engine while preserving M2.08 and excluding M2.10 scoring/review decisions.  
**Verified baseline:** `main` at `5ebcad624f6dec4aa8562249be0c90cd4f8cec4e`  
**Implementation branch:** `feat/m2-09-integrity-engine`  
**Canonical spec:** `docs/superpowers/specs/2026-09-02-m2-09-integrity-engine-design.md`

## Global constraints

- `assessment_attempts.status` remains exactly `IN_PROGRESS | SUBMITTED`.
- Integrity session lifecycle is separate from attempt lifecycle.
- Browser never supplies trusted Worker/form/case/policy/classification/severity authority.
- No automatic invalidation/pass/fail/scoring/reviewer decision.
- No M2.10 implementation.
- No raw camera/microphone/screen media in relational storage.
- No hardware fingerprinting.
- No answer content in integrity events/audit/logs.
- Server receipt time, event sequence, authorization, classification, degraded state and effective policy are authoritative.
- Event history is append-only and conflicting idempotency replays fail closed.
- Provider failure must become explicit degraded evidence and can never silently produce Green.
- Emergency Exit must remain usable even if integrity reporting fails.
- Existing M2.05–M2.08 tests remain permanent regressions.

## Existing repository anchors

Extend rather than duplicate:

- `database/migrations/0042_assessment_attempt_lifecycle.*`
- `database/migrations/0043_assessment_attempt_drafts.*`
- `src/lib/assessment-attempt/**`
- `src/lib/authorization/authorization-domain.ts`
- `src/lib/audit/audit-domain.ts`
- `src/app/worker/(portal)/assessments/[attemptId]/actions.ts`
- `src/app/worker/(portal)/assessments/[attemptId]/page.tsx`
- `src/components/worker/assessment-workspace.tsx`
- `scripts/run-assessment-attempt-tests.mjs`
- `scripts/m2-08-browser-qa.mjs`
- `.github/workflows/m2-08-browser.yml`
- aggregate Engineering and Independent audit workflows.

## Planned M2.09 files

Production:

- `database/migrations/0044_assessment_integrity_engine.up.sql`
- `database/migrations/0044_assessment_integrity_engine.down.sql`
- `src/lib/assessment-integrity/assessment-integrity-domain.ts`
- `src/lib/assessment-integrity/assessment-integrity-policy.ts`
- `src/lib/assessment-integrity/assessment-integrity-repository.ts`
- `src/lib/assessment-integrity/assessment-integrity-service.ts`
- `src/lib/assessment-integrity/assessment-integrity-provider.ts`
- `src/lib/assessment-integrity/assessment-integrity-client-view.ts`
- `src/components/worker/assessment-integrity-monitor.tsx`
- assessment actions/workspace integration as needed.

Verification:

- `tests/platform/assessment-integrity-contract.test.mjs`
- `tests/platform/assessment-integrity-runtime.test.mjs`
- `tests/platform/assessment-integrity-concurrency-runtime.test.mjs`
- `tests/platform/assessment-integrity-policy.test.mjs`
- `tests/platform/assessment-integrity-action-boundary.test.mjs`
- `tests/platform/assessment-integrity-ui-contract.test.mjs`
- `tests/platform/assessment-integrity-rollback.test.mjs`
- `scripts/check-assessment-integrity.mjs`
- `scripts/run-assessment-integrity-tests.mjs`
- `scripts/m2-09-browser-qa.mjs`
- `.github/workflows/m2-09-integrity.yml`
- package/aggregate-gate wiring only where required.

The exact file count may shrink if an accepted existing boundary is clearly the better home. No production abstraction is created solely to match this list.

---

## Task 1 — RED: schema, immutable ledger and domain vocabulary

### 1.1 Write contract/rollback tests first

Require the missing M2.09 structures and invariants:

- migration number is `0044`;
- `assessment_integrity_sessions` has one row maximum per attempt;
- locked attempt/Worker/form lineage;
- frozen `policy_version`;
- lifecycle `ACTIVE | ENDED` only;
- classification `GREEN | YELLOW | RED` only;
- monitoring state `NORMAL | DEGRADED` only;
- SHA-256 device/lease digests only;
- lease/server timestamps and valid end-state constraints;
- `assessment_integrity_events` has session/attempt lineage, server sequence, source, signal, idempotency key, payload digest, observation/receipt time and bounded metadata;
- unique `(session, sequence)` and `(session, idempotency_key)`;
- UPDATE/DELETE of an event is rejected;
- down migration drops only M2.09-owned structures and preserves M2.07/M2.08 attempt/draft/answer structures;
- reapply succeeds;
- domain exports fixed public/source/signal vocabularies and rejects unknown values.

### 1.2 Prove RED

Run the new contract/rollback tests on exact branch head. Expected failure must identify the absent `0044` migration/domain, not syntax or infrastructure failure.

### 1.3 GREEN minimum schema/domain

Create only the migration pair and domain constants/validators/IDs required by the RED tests.

Implement database immutability with an explicit trigger/function or equivalent database boundary; do not rely on repository convention alone.

### 1.4 Verify

Run targeted contract/rollback tests plus M2.07/M2.08 targeted regressions, typecheck and lint.

---

## Task 2 — RED: server policy, metadata safety and provider degradation

### 2.1 RED policy tests

Require:

- immutable policy version identifier;
- server-only evaluator;
- Green/Yellow/Red derived from normalized evidence;
- monitoring `NORMAL | DEGRADED` derived server-side;
- required media/provider failure never remains Green merely because evidence is missing;
- serious identity/prohibited signals can derive Red but do not generate assessment outcome mutations;
- recoverable browser concerns can derive Yellow according to policy;
- safe candidate warning keys/copy categories are produced without threshold exposure;
- exact thresholds/weights are absent from client projection.

### 2.2 RED metadata/provider tests

Require an allowlisted metadata normalizer that:

- accepts only documented primitive diagnostic keys;
- bounds object size, strings and category values;
- rejects secret/token/cookie/authorization/credential-like keys;
- rejects answer/media/blob/base64/DOM/unrestricted error payloads;
- does not store raw provider output.

Provider contract must normalize only allowed provider signals. Provider failure/malformed output returns explicit degraded evidence.

### 2.3 GREEN

Implement `assessment-integrity-policy.ts` and provider/metadata domain helpers. Keep policy server-only.

---

## Task 3 — RED: repository session/lease/event ingestion

### 3.1 RED runtime tests using real PGlite

Seed a real M2.08-compatible owned in-progress attempt and prove:

1. first start creates one integrity session;
2. repeated start for the same binding resumes the same session;
3. foreign Worker cannot start/read/ingest;
4. non-`IN_PROGRESS` attempt cannot create a new active session;
5. server derives binding digest from trusted authorization session id + bounded device nonce and never stores the raw nonce;
6. active lease token is stored only as a digest;
7. matching lease/binding accepts event batch;
8. mismatched/stale lease fails closed;
9. mismatched device binding does not replace a live lease silently;
10. event sequence is assigned server-side;
11. exact idempotent retry returns prior accepted event/rollup without duplicate row;
12. reused idempotency key with different payload fails closed;
13. browser cannot ingest provider/system-only signals;
14. client observation time cannot replace authoritative server receipt time;
15. closing a session is idempotent;
16. ingestion after `ENDED` fails closed except explicitly safe idempotent end replay;
17. evidence timeline is ordered and does not expose digests/secrets/raw metadata.

### 3.2 Concurrency RED

Parallel start must converge on one session. Parallel identical event submission must append once. Parallel different submissions receive distinct server sequences without collision. Competing active device/lease acquisition must not create two authoritative active bindings.

### 3.3 GREEN

Implement repository transaction primitives and service orchestration. Authorization remains in service, not repository.

Use `AuthorizationContext.sessionId` as trusted binding input; never accept an auth-session id from the browser.

---

## Task 4 — RED: service authority, classification rollup and lifecycle integration

### 4.1 RED service tests

Require live Worker `worker.assessments.read`, owned attempt resolution and trusted principal authority.

Input DTO may contain only bounded device nonce, lease token/idempotency/event observation inputs and safe technical-report fields. Tests must fail if client-controlled Worker/form/case/classification/policy/severity fields can influence persisted authority.

After accepted events, service re-evaluates the authoritative persisted event set and atomically updates session rollup. Classification changes remain advisory.

### 4.2 RED attempt integration

- final assessment submit closes the integrity session but preserves existing M2.07/M2.08 answer transaction semantics;
- no score/pass/fail/review state is created;
- Emergency Exit best-effort integrity close must not block M2.08 best-effort save or navigation;
- Save and exit may end/release monitoring according to the session contract without submitting the attempt;
- resuming the same `IN_PROGRESS` attempt can re-establish an expired/released lease under policy while retaining historical evidence.

### 4.3 GREEN

Integrate through existing assessment service/actions with the smallest safe seam. Do not make answer persistence depend on telemetry availability.

---

## Task 5 — RED: controlled browser monitor and technical report UI

### 5.1 Static/UI contract RED

Require:

- explicit monitoring/preflight status before required media capture;
- camera/microphone/display-capture request paths;
- media track ended/muted observers;
- visibility/focus/fullscreen/copy/paste/online/offline observers;
- bounded heartbeat/event batching;
- retry uses stable idempotency keys;
- no client classification logic or thresholds;
- no raw media upload/store path;
- no hardware fingerprint collection;
- accessible safe warnings/status;
- visible `Report technical issue` control;
- visible Emergency Exit remains present;
- no focus-stealing loop or uncloseable-window claim.

### 5.2 Action-boundary RED

Server actions for start/resume, ingest, technical report and close must derive authorization/attempt lineage server-side and map expected conflicts to coarse safe UI errors.

### 5.3 GREEN

Implement `assessment-integrity-monitor.tsx` and narrow existing workspace/action integration.

Media streams are monitoring inputs only; do not persist bytes. Stop tracks on cleanup/end.

Technical report fields are fixed category + bounded note + safe generated diagnostics. It is evidence only, not a support ticket and does not pause time.

---

## Task 6 — RED/GREEN: real Chromium proof

Build deterministic real-browser scenario on clean migrated PGlite with normal Worker authentication and real Next.js server.

Prove where Chromium/CI capabilities permit:

- start/resume integrity session;
- media permission/preflight state;
- display capture path or deterministic supported-denial/degraded path;
- visibility/tab transition;
- blur/focus;
- fullscreen enter/exit;
- copy/paste observation;
- offline/online transition if deterministic;
- track-ended/degraded behavior;
- technical report;
- safe warning copy;
- answer autosave/recovery remains functional;
- Emergency Exit is never trapped by failed telemetry;
- final assessment submit ends integrity session;
- rendered HTML/network bodies contain no hidden thresholds, answer keys, future questions, secrets, raw media or server-only classification policy internals.

Retain browser evidence artifacts and application logs. Fail on unexpected runtime/hydration errors.

---

## Task 7 — Permanent gates and full regression

Add permanent:

- `check:m2-09`;
- `test:m2-09`;
- targeted M2.09 workflow path filters including `.engineering/**` governance evidence where exact-head verification requires them;
- aggregate Engineering-gate inclusion;
- Independent audit coverage.

Run:

- M2.09 targeted contract/runtime/concurrency/policy/action/UI suite;
- migration rollback/reapply;
- M2.09 real Chromium;
- M2.05, M2.06, M2.07 and M2.08 targeted regressions;
- inherited Hard Browser QA and retrospective audit;
- strict TypeScript;
- lint;
- production dependency audit;
- production build;
- Full Engineering;
- Independent full-system audit with zero critical/high enforcement.

No test may be weakened or skipped to obtain Green.

---

## Task 8 — Review, acceptance, integration and post-merge exact-main proof

Before acceptance:

- inspect full branch diff for scope creep, stale/dead code, hidden trust, privacy leakage and duplicated abstractions;
- verify no M2.10 decision/scoring code;
- verify no automatic invalidation;
- verify no raw media/fingerprint path;
- verify M2.08 answer recovery remains intact;
- review PR threads/comments and resolve only by code/evidence, never by dismissal;
- bind acceptance evidence to exact branch SHA.

Merge only with expected-head protection after all required exact-head gates are Green and independent audit accepts.

After merge, run fresh Full Engineering and Independent exact-main verification. Governance-only closure commits must themselves receive final exact-head gates without recursive evidence commits.

## Definition of done

`M2.09 ACCEPTED` requires all approved integrity-engine behaviors implemented and proven on one exact branch head with no unresolved critical/high finding. `MERGED` and `POST_MERGE_VERIFIED` are separate required states. M2.10 remains the next milestone.