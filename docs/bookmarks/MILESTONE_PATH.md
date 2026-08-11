# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and accepted-brick record for the HSE Verify Phase 1 clean rebuild.

The controlling product source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, Version 10 code, chats and discarded implementations may explain intent but cannot override the frozen specification or accepted clean-rebuild evidence.

`docs/NEXT_BUILD_UNIT.md` is the exact current subunit/brick gate. This file and `docs/NEXT_BUILD_UNIT.md` must agree before the engineering gate may pass.

## Brick gate

A brick is DONE only after complete canonical implementation, automated validation, server-side permission/ownership/tenant enforcement where applicable, migration/rollback/recovery evidence where applicable, owner testing for genuinely visible behavior, clean synchronized Git state, exact-head merge discipline, merged-main verification, no unresolved release-blocking defect and a committed closure record.

The next brick may not begin before the current brick is DONE. Internal subunits may advance only through their own defined gates.

## Accepted bricks and owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice — **OWNER PASS — 2 August 2026**; accepted prerequisite slice.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS — 11 August 2026**, pending only this formal closure branch exact-head/merge/merged-main verification.

M1.04 permanently established explicit permission matrices, fixed-role direct-endpoint isolation, trusted Company tenant context, tenant predicates in tenant-owned SQL, transactional authority revalidation, non-enumerating cross-tenant behavior, protected Company-scope demonstration, concurrency and deterministic migration/rollback/reopen proof.

M1.05 permanently established immutable audit facts, transactional durable outbox/background work, persisted role-safe in-app notifications and provider-neutral durable email delivery with accepted local/test behavior. Live provider activation remains later production integration.

## Accepted M1.06 brick

# M1.06 — Secure Storage and Upload Pipeline

**Status: DONE — ENGINEERING PASS — 10 August 2026.**

Accepted subunits:

1. Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE**.
2. Isolated Upload Intake, Validation and Quarantine — **DONE**.
3. Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE**.
4. Authorized Signed Preview/Download Pipeline — **DONE**.
5. Complete M1.06 Isolation, Migration, Recovery and Acceptance — **DONE**.

Final cumulative evidence:

- implementation PR `#55`;
- exact implementation head `86d135f87a2a2b53f12b8d5b1a2438944cd426fc`;
- exact-head full engineering gate `31362444454` — **PASS**;
- implementation merge `4ee689e244c938d04a7db3d58306cff8e20b6213`;
- merged-main full engineering gate `31362848897` — **PASS**;
- acceptance evidence commit `03ac4ac48ee8477833999829c56f829365b92a9e`, full main gate `31363206957` — **PASS**;
- no browser test required for the final internal cumulative unit;
- final evidence `docs/testing/results/M1_06_FINAL_ACCEPTANCE.md`;
- cumulative regressions REG-070 through REG-072 remain permanent.

M1.06 permanently protects private server-owned secure-file storage, exact Worker/Company scope, independent upload validation, quarantine/provenance, durable malware scanning/recovery, `available`-only signed access, live reauthorization, final private-byte validation, restart consistency and deterministic migration replay. REG-076 later fixed cross-platform migration checksum portability without reopening the accepted product boundary.

## Accepted M1.07 brick

# M1.07 — Worker Onboarding and Identity Engine

**Status: DONE — OWNER PASS — 11 August 2026; formal closure transition in progress.**

The accepted Worker Dashboard/Profile slice remained a prerequisite rather than the identity store. M1.07 created a separate versioned identity domain, reused M1.06 private evidence, added deterministic/provider-adapter automated checks, conservative duplicate/recovery handling, verified-only permanent Worker-ID eligibility/issuance, immutable correction history and the real Worker-only `/worker/identity` UX. Reviewer-facing queues remain M2.02.

### Accepted Subunit 1 — Identity Domain, Versioned Persistence and State Machine

**DONE — ENGINEERING PASS — 10 August 2026.**

- PR `#57`, exact head `f7ca497d5becdf7f0a828943c833a8e8915278b6`, gate `31374028751` — PASS;
- merge `19a5ccc877834e78a6568a75099484aebdec0d1c`, merged-main gate `31374492294` — PASS;
- closure PR `#58`, exact head `b1ee6887775371874c743ef4c9fea2461b869799`, gate `31375874361` — PASS;
- closure merge `056a33578a70bc5e6412c861ce28fbd2ae76d40f`, merged-main gate `31376271877` — PASS;
- no browser test required; no visible surface;
- REG-073 and REG-074 remain permanent.

### Accepted Subunit 2 — Worker Identity Draft and Verified Contact Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- PR `#59`, exact head `29350dd47b51471462e21cdebbe6f5b67ebc2c18`, gate `31378294472` — PASS;
- merge `61bdbde805ac4e27ade7a9c787559ff87b2dfb9d`, merged-main gate `31378748392` — PASS;
- closure PR `#60`, exact head `7e922f2d1290dea1ec1b62180a149a9d2754d843`, gate `31379682719` — PASS;
- closure merge `3ebc4a400625d52ba0cfb20c069633113d2f7dc3`, merged-main gate `31380077359` — PASS;
- no browser test required; no visible route/UI;
- permanent evidence `docs/testing/results/M1_07_SUBUNIT2_ACCEPTANCE.md`.

### Accepted Subunit 3 — Secure Identity Document, Profile Photo and Selfie Evidence Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- PR `#61`, exact head `db40d8be93b1ea9064f86a16e2e1915d11b67d96`, gate `31384894092` — PASS;
- merge `00e92e967deedee6e5682423b74a8f26acaa2617`, merged-main gate `31385318724` — PASS;
- closure exact head `df8827f109ff9833d2d26a838fcc037a7aa53ef9`, gate `31386173435` — PASS;
- closure merge `cad56551daac9d9d634eb83c92781a60308a97d4`, merged-main gate `31386659164` — PASS;
- no browser test required; no visible route/UI;
- permanent evidence `docs/testing/results/M1_07_SUBUNIT3_ACCEPTANCE.md`;
- REG-075 remains permanent.

### Accepted Subunit 4 — Automated Identity Checks and Provider Adapter Boundary

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#63`;
- exact head `f606caec4844fe1886e4a2365905f353b1c0d896`, full gate `31409916231` — PASS;
- merge `4d0172ab9bc11c0253b26401f20ba087e1785b81`, merged-main gate `31410396183` — PASS;
- no browser test required; no visible product surface;
- permanent evidence `docs/testing/results/M1_07_SUBUNIT4_ACCEPTANCE.md`.

S4 accepted the fixed `worker_identity.automated_checks` shared-outbox job, own-current-submitted Worker scheduling, trusted leased system lifecycle authority, durable exact-version check runs/results, deterministic local/test assistive checks, preview/production provider fail-closed behavior, safe stale/withdrawn job drainage, no automated final identity decision and no reviewer queue.

### Accepted Subunit 5 — Duplicate Signals, Recovery and Worker-ID Eligibility

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#66`;
- exact head `8d7d3485a4d1f8017e0b5f0dab46ef8d9be5cb8c`, gate `31415441023` — PASS;
- merge `538948402c703970fe6f6d84ab3a6e8cf61d8ab8`, merged-main gate `31431146567` — PASS;
- closure PR `#67`, exact head `87a90dced3b03c79e709f8ff6ca21923c3a5fa97`, gate `31432224808` — PASS;
- closure merge `b7e9b7cd68a7ba4fd6227bf266c6fa89c0a2fd0a`, merged-main gate `31432693829` — PASS;
- no browser test required; no visible product surface;
- permanent evidence `docs/testing/results/M1_07_SUBUNIT5_ACCEPTANCE.md`.

S5 accepted conservative deterministic duplicate signals, immutable/version-bound checks and dispositions, explicit server-owned continue/recovery/review/block outcomes, no silent or automatic merge, separation from authenticated account-recovery authority, verified-only permanent Worker-ID issuance and opaque/non-sequential/idempotent Worker IDs.

### Accepted Subunit 6 — Correction Versions, Worker Identity UX and Cumulative Acceptance

**DONE — OWNER PASS — 11 August 2026.**

S6 introduced immutable correction versions/history and the real Worker-only `/worker/identity` workflow. Its cumulative release acceptance discovered and permanently fixed:

- REG-077 — merged-main handoff must use the immutable pre-push base;
- REG-078 — Worker identity submission readiness must be actionable and atomic with the real lifecycle transition;
- REG-079 — React Server Action forms must not override React-owned method/encoding metadata.

Final release evidence:

- final root-fix PR `#72`;
- exact final head `6dbac3cddeb8bea1ae85b7f92c065fa2716e0bc3`;
- exact-head full gate `31446794451` — PASS;
- expected-head-locked merge `4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`;
- merged-main full gate `31447079334` — PASS;
- exact owner-tested release SHA `4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`;
- targeted `/worker/identity` owner/browser retest — **PASS — 11 August 2026**;
- final acceptance `docs/testing/results/M1_07_FINAL_ACCEPTANCE.md`;
- formal closure record `docs/testing/results/M1_07_FINAL_CLOSURE.md`.

The owner PASS confirms the final release-blocking boundaries: no invalid Server Action form transport warning during evidence upload/replacement; exact Country of residence readiness feedback instead of generic failure; successful submission after completion without manual refresh; and reachable automated checks that remain assistive rather than self-verifying.

M1.07 accepted invariants remain permanent: server-owned identity authority, trusted verified contacts, private same-Worker evidence, immutable submitted/correction history, atomic readiness/submission, assistive provider output, no automatic duplicate merge, verified-only opaque Worker ID, bounded audit, role isolation and no M2.02 reviewer queue pulled forward.

Live liveness/face/document production provider activation remains open under `LATER-038` and does not reopen the accepted provider-neutral/fail-closed M1.07 contract.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | **DONE** | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | **DONE** | Accepted. |
| M1.03 | Authentication and portal isolation | **DONE** | Live SMS provider remains later activation. |
| M1.04 | Authorization and tenant isolation | **DONE** | Accepted. |
| M1.05 | Audit and notification foundations | **DONE** | Live providers remain later activation. |
| M1.06 | Secure storage and upload pipeline | **DONE** | Production private storage/scanner activation remains later. |
| M1.07 | Worker onboarding and Identity Engine | **DONE — OWNER PASS** | Formal closure branch exact-head/merge/merged-main gate only; product/owner boundary accepted. |
| M1.08 | Company registration and verification | **READY TO BUILD AFTER M1.07 CLOSURE MERGES GREEN** | Not implemented yet. |
| M1.09 | Sites, departments and team | **NOT STARTED / BLOCKED** | After M1.08. |
| M1.10 | Worker invitations and Company codes | **PARTIAL PREREQUISITE ONLY / BLOCKED** | Staff provisioning is not the business invitation/code workflow. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | **NOT STARTED / BLOCKED** | After prior Company/Worker foundations. |
| M1.12 | Public verification foundation | **PROTOTYPE/DEMO REFERENCE ONLY / BLOCKED** | Clean-rebuild implementation remains. |

**Milestone 1 progress: 7 of 12 bricks are DONE.**

## Canonical remaining roadmap

The frozen Phase 1 roadmap contains **37 bricks total: 12 in Milestone 1, 13 in Milestone 2 and 12 in Milestone 3.** Only fully accepted bricks count as DONE.

### Milestone 2 — Assurance, Assessments, Review and Interviews

All remain BLOCKED until Milestone 1 closes:

1. M2.01 — Assurance Order and Case Engine
2. M2.02 — Evidence Verification Queues
3. M2.03 — Frameworks and Effective Policy
4. M2.04 — Question Bank
5. M2.05 — Randomized Assessment Form Generation
6. M2.06 — Assessment Catalogue and Eligibility
7. M2.07 — Candidate Assessment Window
8. M2.08 — Answer Persistence and Interruption Recovery
9. M2.09 — Integrity Engine
10. M2.10 — Written Scoring and Review Engine
11. M2.11 — Interview Scheduling and Assignment
12. M2.12 — Interview Console and Playbook
13. M2.13 — Decision Engine

### Milestone 3 — Operations, Billing, Intelligence and Production Launch

All remain BLOCKED until Milestone 2 closes:

1. M3.01 — Credential and QR Issuance
2. M3.02 — Digital Passport and Living Record
3. M3.03 — Scoped Share Links
4. M3.04 — Company Action Centre and Analytics
5. M3.05 — Billing and Subscriptions
6. M3.06 — Reports and Delivery
7. M3.07 — Appeals, Renewal, Suspension and Revocation
8. M3.08 — Admin Operational Completeness
9. M3.09 — Privacy and Accessibility Operations
10. M3.10 — Production Integrations
11. M3.11 — Load, Security and Recovery Certification
12. M3.12 — Production Launch and Operational Handover

## Exit gates

### Milestone 1 exit

A Worker can securely register, verify contacts, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal/tenant isolation, audit and secure uploads pass security testing.

### Milestone 2 exit

A complete assurance case runs end-to-end through evidence verification, randomized/non-repeating assessment delivery, durable answer recovery, integrity monitoring, written review, interview and final decision without cross-role/cross-tenant leakage or lost state.

### Milestone 3 exit

Credentials, living records, sharing, Company operations, billing/reporting, appeals/privacy/accessibility, production providers, load/security/recovery certification and production handover are release-ready.

## Correct execution order

1. Finish the formal M1.07 closure exact-head gate, exact-head merge and merged-main gate. Do not add M1.08 product code to the closure branch.
2. Build M1.08 Company Registration and Verification as the only next permitted product brick.
3. Continue M1.09 through M1.12 in order and pass the complete Milestone 1 exit test.
4. Build M2.01 through M2.13 in order and pass Milestone 2 exit.
5. Build M3.01 through M3.12 in order and pass production-launch exit.

No later brick may be pulled forward merely because prototype code once displayed it.
