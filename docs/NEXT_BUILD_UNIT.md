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

- implementation PR `#61`, exact head `db40d8be93b1ea9064f86a16e2e1915d11b67d96`, gate `31384894092` — **PASS**;
- implementation merge `00e92e967deedee6e5682423b74a8f26acaa2617`, merged-main gate `31385318724` — **PASS**;
- closure exact head `df8827f109ff9833d2d26a838fcc037a7aa53ef9`, gate `31386173435` — **PASS**;
- closure merged main `cad56551daac9d9d634eb83c92781a60308a97d4`, gate `31386659164` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no visible surface;
- permanent acceptance evidence `docs/testing/results/M1_07_SUBUNIT3_ACCEPTANCE.md`;
- REG-075 protects real M1.06 scan-job/generation construction in S3 fixtures.

S3 accepted same-Worker `available` M1.06 evidence binding, image-only profile photo/selfie rules, document metadata, one active binding per purpose, immutable supersession lineage, stale-replacement protection, post-submission freeze, evidence-complete submission readiness, and deterministic monotonic rollback/reapply/restart behavior.

## Accepted cumulative owner/browser baseline

The cumulative visible baseline through the currently accepted `main` has been owner-tested and reported **PASS — 10 August 2026**. Do not repeat those already-passed registration, login, role isolation, Company tenant-scope, notification, session/recovery and responsive-baseline checks merely because S4/S5 change internal identity infrastructure. New browser testing becomes mandatory again when S6 adds the real `/worker/identity` surface.

The Windows owner gate also reproduced REG-076. The root cause was migration SQL CRLF/LF checksum variance. PR `#64` canonicalized migration line endings while preserving exact historical checksum repair allowlists; merged main `7f5eb690c185a04e4b1e9471d7993c2cf1a83424`, merged-main gate `31399358346` — **PASS**.

## Milestone 1 progress

**6 of 12 Milestone 1 bricks are DONE.**

M1.07 remains the only active brick. M1.08 and later bricks remain **BLOCKED** until the complete M1.07 brick is accepted.

Current accepted canonical `main` beneath Subunit 4:

`7f5eb690c185a04e4b1e9471d7993c2cf1a83424`

## Current build gate

# M1.07 — WORKER ONBOARDING AND IDENTITY ENGINE — IN PROGRESS

The Worker Profile slice is a reusable prerequisite only. Identity remains a separate versioned, server-authoritative domain.

### Canonical M1.07 outcome

A Worker can build and submit a versioned identity using verified contact authority and secure M1.06 evidence; the platform runs deterministic/adapter-backed automated checks, surfaces duplicate signals without auto-merging, preserves correction history, and issues a permanent Worker ID only after all required gates pass. Reviewer-facing verification queues remain M2.02.

## M1.07 internal subunits

1. **Identity Domain, Versioned Persistence and State Machine — DONE.**
2. **Worker Identity Draft and Verified Contact Binding — DONE.**
3. **Secure Identity Document, Profile Photo and Selfie Evidence Binding — DONE.**
4. **Automated Identity Checks and Provider Adapter Boundary — IN PROGRESS.**
   - implementation PR `#63` is the only active implementation PR;
   - latest validated behavioral head `52c40c1bfab3e1a6b0c80363ef9838cc96cc45a6`, full gate `31409182878` — **PASS**;
   - exact final implementation head remains pending after current-state documentation is committed and reverified;
   - shared M1.05 outbox job type is exactly `worker_identity.automated_checks`; no second queue is permitted;
   - Worker authority can schedule only the Worker's own exact current submitted version; Worker code cannot move lifecycle into automated checks;
   - a live trusted outbox lease is the server authority for `submitted -> automated_checks` and later `automated_checks -> manual_review`;
   - local/test adapter is deterministic assistive evidence only: document consistency can pass while face comparison/liveness require review; it cannot verify, reject or merge an identity;
   - preview/production provider-dependent checks fail closed while no approved provider is configured;
   - stale/withdrawn jobs drain safely without advancing identity;
   - durable run/result history is version-bound and restart-safe;
   - the widened historical `0013_secure_file_malware_scan` checksum is pinned to `89a0168ff92b2d0df5dad4d5f1b9b99ab5d5a2c92c1b28ce7e03fdf9a16baada`, with only the exact accepted predecessors retained;
   - no M2.02 reviewer assignment/queue UI and no S6 browser identity UI is introduced by S4;
   - browser/owner test is **NOT REQUIRED** for S4 because there is no browser-visible product change.
5. **Duplicate Signals, Recovery and Worker-ID Eligibility — BLOCKED by Subunit 4.**
   - compare verified email/phone, document identifiers, name/DOB and lawful provider/fingerprint signals;
   - outcomes: continue, recover existing account, duplicate review, or temporarily block Worker-ID issuance;
   - never auto-merge identities;
   - permanent Worker ID is server-generated, opaque, unique, idempotent and eligibility-gated.
6. **Correction Versions, Worker Identity UX and Cumulative Acceptance — BLOCKED by Subunit 5.**
   - correction requests create new versions rather than overwrite accepted history;
   - real `/worker/identity` route, upload/check/status workflow and accessible responsive UX;
   - complete loading/empty/validation/failure/permission-denial/recovery states and status timeline;
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
5. Permanent Worker ID issuance is server-authoritative, unique, opaque, idempotent and gated.
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
- After S4 closes, start S5 automatically. After S5 closes, build S6 and stop only at the genuine S6 owner/browser acceptance boundary. Do not start M1.08 while any M1.07 release blocker remains.
