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
- REG-075 permanently guarded.

### Subunit 4 — Automated Identity Checks and Provider Adapter Boundary

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#63`;
- exact final implementation head `f606caec4844fe1886e4a2365905f353b1c0d896`, exact-head full gate `31409916231` — **PASS**;
- implementation merge `4d0172ab9bc11c0253b26401f20ba087e1785b81`, merged-main full gate `31410396183` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no browser-visible product behavior changed;
- permanent acceptance evidence `docs/testing/results/M1_07_SUBUNIT4_ACCEPTANCE.md`.

S4 accepted the fixed shared-outbox `worker_identity.automated_checks` job, Worker-only own-current-submitted scheduling, trusted leased system lifecycle authority, durable exact-version check runs/results, deterministic local/test assistive checks, preview/production provider fail-closed behavior, safe stale/withdrawn job drainage, no automated final identity decision, no reviewer queue and exact migration checksum lineage while retaining REG-076 CRLF/LF portability.

### Subunit 5 — Duplicate Signals, Recovery and Worker-ID Eligibility

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#66`;
- accepted base main `9f35335e206eb899e630908efc425d2727dc5d91`;
- exact final implementation head `8d7d3485a4d1f8017e0b5f0dab46ef8d9be5cb8c`, exact-head full gate `31415441023` — **PASS**;
- implementation merge `538948402c703970fe6f6d84ab3a6e8cf61d8ab8`, merged-main full gate `31431146567` — **PASS**;
- closure PR `#67`, exact closure head `87a90dced3b03c79e709f8ff6ca21923c3a5fa97`, exact-head gate `31432224808` — **PASS**;
- closure merge `b7e9b7cd68a7ba4fd6227bf266c6fa89c0a2fd0a`, merged-main gate `31432693829` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no browser-visible product behavior changed;
- permanent acceptance evidence `docs/testing/results/M1_07_SUBUNIT5_ACCEPTANCE.md`.

S5 accepted deterministic conservative duplicate signals without copying compared personal values into signal history; immutable/version-bound checks and dispositions; explicit server-authorized continue/recovery/review/block dispositions; no silent or automatic merge; separation from account-recovery authority; verified-only permanent Worker-ID issuance; opaque/non-sequential/idempotent Worker IDs; Worker own-status isolation; immutable audit; and monotonic migration/restart proof.

The first S5 gate exposed an isolated runtime-harness dependency omission. The harness was corrected to compile the directly exercised accepted S4 modules, after which both the exact-head and merged-main complete gates passed. No independent product/security regression identifier was required.

## Accepted cumulative owner/browser baseline

The cumulative visible baseline through the accepted pre-S4 main was owner-tested and reported **PASS — 10 August 2026**. Do not repeat those already-passed registration, login, role isolation, Company tenant-scope, notification, session/recovery and responsive-baseline checks merely because S4/S5 changed internal identity infrastructure. New browser testing is mandatory when S6 adds the real `/worker/identity` surface.

REG-076 was repaired by PR `#64`; merged main `7f5eb690c185a04e4b1e9471d7993c2cf1a83424`, merged-main gate `31399358346` — **PASS**.

## Milestone 1 progress

**6 of 12 Milestone 1 bricks are DONE.**

M1.07 remains the only active brick. M1.08 and later bricks remain **BLOCKED** until the complete M1.07 brick is accepted.

Current accepted canonical `main` beneath Subunit 6:

`b7e9b7cd68a7ba4fd6227bf266c6fa89c0a2fd0a`

## Current build gate

# M1.07 — WORKER ONBOARDING AND IDENTITY ENGINE — IN PROGRESS

### Canonical M1.07 outcome

A Worker can build and submit a versioned identity using verified contact authority and secure M1.06 evidence; the platform runs deterministic/adapter-backed automated checks, surfaces duplicate signals without auto-merging, preserves correction history, and issues a permanent Worker ID only after all required gates pass. Reviewer-facing verification queues remain M2.02.

## M1.07 internal subunits

1. **Identity Domain, Versioned Persistence and State Machine — DONE.**
2. **Worker Identity Draft and Verified Contact Binding — DONE.**
3. **Secure Identity Document, Profile Photo and Selfie Evidence Binding — DONE.**
4. **Automated Identity Checks and Provider Adapter Boundary — DONE.**
5. **Duplicate Signals, Recovery and Worker-ID Eligibility — DONE.**
6. **Correction Versions, Worker Identity UX and Cumulative Acceptance — IN PROGRESS on implementation PR `#68`; automation and exact-head verification are active, and the next mandatory release boundary is the targeted owner/browser test after implementation merge and merged-main verification pass.**
   - corrections must create explicit new identity versions and lineage; submitted/verified historical versions and their evidence may never be overwritten;
   - `verified -> correction_pending` is the only correction-entry lifecycle transition; accepted or rejected correction returns the identity through the frozen `correction_pending -> verified` boundary without inventing new lifecycle states;
   - build the real Worker-only `/worker/identity` route within the accepted Worker portal shell and add it to shared Worker navigation;
   - the route must load/create the Worker's own identity and expose legal/personal draft fields governed by S2;
   - verified email and phone remain server-derived authentication facts and display as non-editable identity contacts, never browser-authoritative editable fields;
   - identity document, profile photo and selfie use the accepted M1.06 private secure-file pipeline plus S3 exact same-Worker binding, accepted MIME/provenance rules, replacement lineage and submission readiness;
   - draft saving must use optimistic `draft_revision`; stale writes must fail safely and visibly;
   - submission must enforce complete personal/contact/evidence readiness server-side before `draft -> submitted`;
   - after submission the Worker may schedule the accepted S4 automated-check job for only the exact current version; the UI may show safe assistive check state but cannot claim final verification based only on provider output;
   - show the Worker's bounded S5 duplicate/eligibility/permanent Worker-ID status without exposing candidate identities, compared personal values or internal recovery authority;
   - implement loading, empty, success, validation, stale-write, upload/scan failure, provider-unavailable, permission/session denial and recovery guidance states without refresh-only behavior;
   - keep reviewer decisions/queues out of S6; M2.02 remains the reviewer-facing verification boundary;
   - preserve responsive/accessibility behavior in the existing Worker shell and navigation;
   - add focused S6 tests plus a cumulative M1.07 acceptance suite covering correction immutability/lineage, identity isolation, evidence safety, automated checks, duplicate/Worker-ID eligibility, route authority, migration/restart and stale-session/concurrency behavior;
   - exact implementation head and merged main must each pass the complete fail-closed engineering gate;
   - **genuine targeted owner/browser live test is mandatory after S6 automation and merged-main verification pass and before M1.07 closes**;
   - stop at that owner-test boundary; do not start M1.08 until owner PASS and formal M1.07 closure.

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
2. Identity/evidence/check/duplicate/Worker-ID ownership comes from server-trusted authority; browser input never selects account, role, tenant, provider credentials, reviewer or decision authority.
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
- S6 is the active final M1.07 subunit. Finish its automation and exact-head verification, merge only that verified head, require merged-main verification, then stop at the genuine `/worker/identity` owner/browser acceptance boundary. Do not start M1.08 while any M1.07 release blocker remains.