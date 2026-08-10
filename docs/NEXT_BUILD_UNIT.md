# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen product scope remains the **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records accepted brick history and build order. Earlier Version 10/prototype code is capability reference only and is not an architectural dependency.

## Accepted brick gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**; accepted slice only, not complete M1.07.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.

## M1.07 accepted subunits

### Subunit 1 — Identity Domain, Versioned Persistence and State Machine

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#57`, exact head `f7ca497d5becdf7f0a828943c833a8e8915278b6`, gate `31374028751` — **PASS**;
- merge `19a5ccc877834e78a6568a75099484aebdec0d1c`, merged-main gate `31374492294` — **PASS**;
- closure PR `#58`, exact head `b1ee6887775371874c743ef4c9fea2461b869799`, gate `31375874361` — **PASS**;
- closure merge `056a33578a70bc5e6412c861ce28fbd2ae76d40f`, merged-main gate `31376271877` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no visible surface;
- REG-073 and REG-074 permanently guarded.

### Subunit 2 — Worker Identity Draft and Verified Contact Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#59`, exact head `29350dd47b51471462e21cdebbe6f5b67ebc2c18`, gate `31378294472` — **PASS**;
- merge `61bdbde805ac4e27ade7a9c787559ff87b2dfb9d`, merged-main gate `31378748392` — **PASS**;
- closure PR `#60`, exact head `7e922f2d1290dea1ec1b62180a149a9d2754d843`, gate `31379682719` — **PASS**;
- closure merge `3ebc4a400625d52ba0cfb20c069633113d2f7dc3`, merged-main gate `31380077359` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no visible surface.

### Subunit 3 — Secure Identity Document, Profile Photo and Selfie Evidence Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#61`;
- accepted exact head `db40d8be93b1ea9064f86a16e2e1915d11b67d96`;
- exact-head full gate `31384894092` — **PASS**;
- implementation merge `00e92e967deedee6e5682423b74a8f26acaa2617`;
- merged-main full gate `31385318724` — **PASS**;
- browser/owner test — **NOT REQUIRED** because S3 introduced no browser-visible product surface;
- permanent acceptance evidence: `docs/testing/results/M1_07_SUBUNIT3_ACCEPTANCE.md`;
- REG-075 protects real M1.06 scan-job/generation lifecycle construction in S3 tests.

S3 accepted same-Worker `available` M1.06 evidence binding, image-only profile photo/selfie rules, identity-document metadata, one-active-binding-per-purpose, immutable superseded lineage, stale-replacement protection, post-submission freeze, evidence-complete submission readiness, no relational evidence bytes/storage provenance, no physical dependency from identity history to M1.06 secure-file table lifetime, and deterministic monotonic rollback/reapply/restart behavior.

## Milestone 1 progress

**6 of 12 Milestone 1 bricks are DONE.**

M1.07 remains the only active brick. M1.08 and later bricks remain blocked until the complete M1.07 brick is accepted.

Current accepted canonical `main` before Subunit 4:

`00e92e967deedee6e5682423b74a8f26acaa2617`

## Current build gate

# M1.07 — WORKER ONBOARDING AND IDENTITY ENGINE — IN PROGRESS

The Worker Profile slice is a reusable prerequisite only. Identity remains a separate versioned, server-authoritative domain.

### Canonical M1.07 outcome

A Worker can build and submit a versioned identity using verified contact authority and secure M1.06 evidence; the platform runs deterministic/adapter-backed automated checks, surfaces duplicate signals without auto-merging, preserves correction history, and issues a permanent Worker ID only after all required gates pass. Reviewer-facing verification queues remain M2.02.

## M1.07 internal subunits

1. **Identity Domain, Versioned Persistence and State Machine — DONE.**
   - separate identity aggregate/version history;
   - canonical lifecycle and immutable submitted versions;
   - Worker self-ownership, live role-bound authority and optimistic lifecycle locking;
   - bounded audit facts and deterministic migration/restart behavior.

2. **Worker Identity Draft and Verified Contact Binding — DONE.**
   - version-owned personal facts and independent `draft_revision`;
   - verified email/phone derived from live authentication authority, never browser claims;
   - SQL contact overwrite/revalidation and complete-facts/contact submission gate;
   - S2 layer tests stop at `0016_worker_identity_draft_details`.

3. **Secure Identity Document, Profile Photo and Selfie Evidence Binding — DONE.**
   - accepted M1.06-only storage path;
   - exact Worker/available/non-tenant evidence binding in service, repository transaction and SQL;
   - passport/national-ID/residence-permit metadata;
   - PNG/JPEG-only profile-photo/selfie evidence;
   - one active binding per purpose, idempotent replay, optimistic replacement and immutable superseded history;
   - submitted evidence frozen/non-deletable;
   - no bytes/base64/object keys/hashes/storage credentials in relational identity evidence;
   - no physical FK to rollback-owned M1.06 secure-file metadata;
   - S3 tests stop at `0018_worker_identity_evidence_freeze_guard`; release/full-stack tests still apply all migrations.

4. **Automated Identity Checks and Provider Adapter Boundary — READY TO BUILD.**
   - create a version-owned automated-check domain for document consistency, face comparison and liveness evidence;
   - move a submitted identity into `automated_checks` only through server/system authority, never through a Worker browser-selected decision;
   - deterministic local/test adapters must exercise the same contracts as live-provider adapters without pretending to be production providers;
   - preview/production provider-dependent checks must fail closed until an approved provider and credentials are configured;
   - provider requests/results must be bounded, typed and non-sensitive; no raw identity images, document numbers, object keys, hashes, credentials or tokens in audit/provider summaries;
   - provider/AI results are assistive evidence only and cannot themselves verify/reject/merge a Worker;
   - automated-check attempts/results must be durable, idempotent/retry-safe and tied to the exact immutable submitted identity version/evidence set;
   - stale provider results must not be able to advance a newer identity version;
   - deterministic checks and provider outcomes must drive only canonical lifecycle transitions; no new transition may be invented for convenience;
   - no M2.02 reviewer assignment/queue UI may be pulled into S4;
   - no browser-visible S4 surface is planned, so browser testing is not a S4 gate unless implementation actually changes visible product behavior.

5. **Duplicate Signals, Recovery and Worker-ID Eligibility — BLOCKED by Subunit 4.**
   - compare verified email/phone, document identifiers, name/DOB and lawful provider/fingerprint signals;
   - outcomes: continue, recover existing account, duplicate review, or temporarily block Worker-ID issuance;
   - **never auto-merge identities**;
   - permanent Worker ID is server-generated, unique, idempotent and eligibility-gated.

6. **Correction Versions, Worker Identity UX and Cumulative Acceptance — BLOCKED by Subunit 5.**
   - correction requests create new versions rather than overwrite accepted history;
   - real `/worker/identity` route, upload/check/status workflow and accessible responsive UX;
   - loading/empty/validation/failure/permission-denial/recovery states and status timeline;
   - complete restart/concurrency/isolation/security/route regression coverage;
   - **genuine owner/browser live test is mandatory before M1.07 closes.**

## Canonical M1.07 lifecycle to preserve

- `DRAFT -> SUBMITTED`;
- `SUBMITTED -> AUTOMATED_CHECKS` or `WITHDRAWN` only before review starts;
- `AUTOMATED_CHECKS -> MANUAL_REVIEW | MORE_INFO | REJECTED`;
- `MANUAL_REVIEW -> VERIFIED | MORE_INFO | REJECTED | ESCALATED`;
- `MORE_INFO -> MANUAL_REVIEW`;
- `VERIFIED -> CORRECTION_PENDING | EXPIRED_DOCUMENT | SUSPENDED`;
- `CORRECTION_PENDING -> VERIFIED` through a new accepted version or rejected correction;
- `SUSPENDED -> VERIFIED/REINSTATED | CLOSED` according to authorized recovery policy.

No outbound transition from `REJECTED`, `ESCALATED`, `EXPIRED_DOCUMENT`, `REINSTATED`, `CLOSED` or `WITHDRAWN` may be invented merely to satisfy implementation convenience. M1.07 must not create M2.02 reviewer queues.

## Non-negotiable controls

1. Raw identity document/photo/selfie bytes stay private M1.06 objects; never JSON/base64/relational blobs/public URLs.
2. Identity/evidence/check ownership comes from server-trusted authority; browser input never selects account, role, tenant, provider credentials, reviewer or decision authority.
3. Submitted versions/evidence are immutable; corrections create explicit new version/evidence lineage.
4. Duplicate detection never silently merges identities.
5. Permanent Worker ID issuance is server-authoritative, unique, idempotent and gated.
6. Provider-dependent checks use adapters; local/test deterministic, preview/production fail closed until approved provider configuration exists.
7. AI/provider output cannot be the sole final verification/rejection/merge decision.
8. Material transitions, duplicate dispositions and Worker-ID issuance have bounded immutable audit evidence without sensitive identity/contact/storage/provider secrets.
9. M1.03 role isolation, M1.04 authorization, M1.05 audit/outbox and M1.06 private-file rules may not be weakened or duplicated.
10. Every serious reproduced defect receives a stable regression guard before closure.
11. Exact branch head must pass focused and complete fail-closed gates; merge only that SHA and repeat the complete gate on merged `main`.
12. Visible M1.07 work requires owner/browser testing before the brick is DONE.

## Explicitly blocked during M1.07

- M1.08 Company registration/verification and all later Milestone 1 bricks.
- M2.02 reviewer-facing identity/evidence queues.
- Assessments, integrity monitoring, written scoring, interviews, decisions, credentials, billing and later Milestone 2/3 workflows.
- Fake production activation for SMS/private-object-storage/malware/liveness/face/video/payment providers.

## Permanent build procedure

- Reproduce defects before fixing them and trace the real state/data/permission boundary.
- Fix the smallest complete root cause and add permanent regression coverage.
- Keep one internal subunit active at a time.
- Lower-layer tests stay pinned to their accepted migration ceiling; the complete application/release gate always applies the full current migration stack.
- Run focused checks early and the complete gate before merge.
- Merge only an exact verified head, then run the complete gate on merged `main`.
- Require browser testing only for genuine visible behavior, but never waive it when visible M1.07 UX is affected.
- Start Subunit 4 only after this S3 closure passes exact-head and merged-main verification; never start M1.08 while any M1.07 release blocker remains.
