# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and accepted-brick record for the HSE Verify Phase 1 clean rebuild.

The controlling product source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, Version 10 code, chats and discarded implementations may explain intent but cannot override the frozen specification or accepted clean-rebuild evidence.

`docs/NEXT_BUILD_UNIT.md` is the exact current subunit gate. This file and `docs/NEXT_BUILD_UNIT.md` must agree before the engineering gate may pass.

## Brick gate

A brick is DONE only after complete canonical implementation, automated validation, server-side permission/ownership/tenant enforcement where applicable, migration/rollback/recovery evidence where applicable, owner testing for genuinely visible behavior, clean synchronized Git state, merged-main verification, no unresolved release-blocking defect and a committed closure record.

The next brick may not begin before the current brick is DONE. Internal subunits may advance only through their own defined gates.

## Accepted bricks and owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice — **OWNER PASS — 2 August 2026**; accepted slice only, not complete M1.07.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.

M1.04 accepted explicit permission matrices, fixed-role direct-endpoint isolation, trusted Company tenant context, tenant predicates in tenant-owned SQL, transactional authority revalidation, non-enumerating cross-tenant behavior, protected Company-scope demonstration, concurrency and deterministic migration/rollback/reopen proof.

M1.05 accepted immutable audit facts, transactional durable outbox/background work, persisted role-safe in-app notifications and provider-neutral durable email delivery with local/test adapter. Live provider activation remains M3.10 work.

## M1.06 accepted brick

# M1.06 — Secure Storage and Upload Pipeline

**Status: DONE — ENGINEERING PASS — 10 August 2026.**

Accepted subunits:

1. **Secure File Domain, Metadata Schema and Private Object Storage Adapter — DONE.**
2. **Isolated Upload Intake, Validation and Quarantine — DONE.**
3. **Durable Malware Scan Job and Local/Test Scanner Adapter — DONE.**
4. **Authorized Signed Preview/Download Pipeline — DONE.**
5. **Complete M1.06 Isolation, Migration, Recovery and Acceptance — DONE.**

Final Subunit 5 evidence:

- implementation PR `#55`;
- exact implementation head `86d135f87a2a2b53f12b8d5b1a2438944cd426fc`;
- exact-head full engineering gate `31362444454` — **PASS**;
- implementation merge `4ee689e244c938d04a7db3d58306cff8e20b6213`;
- merged-main full engineering gate `31362848897` — **PASS**;
- acceptance evidence commit `03ac4ac48ee8477833999829c56f829365b92a9e` and full main gate `31363206957` — **PASS**;
- browser owner test — **NOT REQUIRED** because the final cumulative unit introduced no visible product surface;
- final evidence `docs/testing/results/M1_06_FINAL_ACCEPTANCE.md`;
- permanent cumulative regressions REG-070 through REG-072.

M1.06 permanently protects private secure-file identity/storage, exact Worker/Company scope, independent upload validation, quarantine/provenance, durable malware scanning/recovery, `available`-only signed access, live reauthorization, final private-byte validation, restart consistency and deterministic migration replay.

REG-076 later fixed cross-platform migration checksum portability without reopening M1.06 product behavior. Windows CRLF and canonical LF checkouts now normalize to the same migration authority while historical repairs remain exact and fail closed. PR `#64` merged as `7f5eb690c185a04e4b1e9471d7993c2cf1a83424`; merged-main gate `31399358346` — **PASS**.

## Current brick

# M1.07 — Worker Onboarding and Identity Engine

**Status: IN PROGRESS — Subunits 1 through 5 accepted; Subunit 6 is actively building in PR `#68` and is the mandatory owner/browser boundary after exact-head and merged-main automation pass.**

The accepted Worker Dashboard/Profile vertical slice is a reusable prerequisite, not the full Identity Engine. M1.07 adds a separate versioned identity domain, secure M1.06 evidence binding, deterministic automated checks/provider boundaries, duplicate-signal handling, permanent Worker-ID eligibility/issuance, correction history and the real `/worker/identity` Worker UX. Reviewer-facing verification queues remain M2.02.

### Accepted Subunit 1 — Identity Domain, Versioned Persistence and State Machine

**DONE — ENGINEERING PASS — 10 August 2026.**

- PR `#57`, exact implementation head `f7ca497d5becdf7f0a828943c833a8e8915278b6`, gate `31374028751` — **PASS**;
- merge `19a5ccc877834e78a6568a75099484aebdec0d1c`, merged-main gate `31374492294` — **PASS**;
- closure PR `#58`, exact closure head `b1ee6887775371874c743ef4c9fea2461b869799`, gate `31375874361` — **PASS**;
- closure merge `056a33578a70bc5e6412c861ce28fbd2ae76d40f`, merged-main gate `31376271877` — **PASS**;
- no browser test required; no visible product surface;
- REG-073 protects authentication rollback independence; REG-074 protects dependency-injected runtime isolation.

### Accepted Subunit 2 — Worker Identity Draft and Verified Contact Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- PR `#59`, exact implementation head `29350dd47b51471462e21cdebbe6f5b67ebc2c18`, gate `31378294472` — **PASS**;
- merge `61bdbde805ac4e27ade7a9c787559ff87b2dfb9d`, merged-main gate `31378748392` — **PASS**;
- closure PR `#60`, exact closure head `7e922f2d1290dea1ec1b62180a149a9d2754d843`, gate `31379682719` — **PASS**;
- closure merge `3ebc4a400625d52ba0cfb20c069633113d2f7dc3`, merged-main gate `31380077359` — **PASS**;
- no browser test required; no visible route/UI;
- permanent acceptance record `docs/testing/results/M1_07_SUBUNIT2_ACCEPTANCE.md`.

### Accepted Subunit 3 — Secure Identity Document, Profile Photo and Selfie Evidence Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- PR `#61`, exact implementation head `db40d8be93b1ea9064f86a16e2e1915d11b67d96`, exact-head gate `31384894092` — **PASS**;
- implementation merge `00e92e967deedee6e5682423b74a8f26acaa2617`, merged-main gate `31385318724` — **PASS**;
- closure exact head `df8827f109ff9833d2d26a838fcc037a7aa53ef9`, gate `31386173435` — **PASS**;
- closure merge `cad56551daac9d9d634eb83c92781a60308a97d4`, merged-main gate `31386659164` — **PASS**;
- no browser test required; no visible product route/UI;
- permanent acceptance record `docs/testing/results/M1_07_SUBUNIT3_ACCEPTANCE.md`;
- REG-075 permanently protects real M1.06 scan-job/generation state in S3 fixtures.

### Accepted Subunit 4 — Automated Identity Checks and Provider Adapter Boundary

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#63`;
- exact final implementation head `f606caec4844fe1886e4a2365905f353b1c0d896`, exact-head full gate `31409916231` — **PASS**;
- implementation merge `4d0172ab9bc11c0253b26401f20ba087e1785b81`, merged-main full gate `31410396183` — **PASS**;
- browser test **NOT REQUIRED**; no visible product surface;
- permanent acceptance record `docs/testing/results/M1_07_SUBUNIT4_ACCEPTANCE.md`.

S4 accepted the fixed shared-outbox `worker_identity.automated_checks` job, own-current-submitted Worker scheduling, trusted leased system lifecycle authority, durable exact-version check runs/results, deterministic local/test assistive checks, fail-closed preview/production provider behavior, stale/withdrawn job drainage, no final automated identity decision, no reviewer queue, and exact historical migration checksum lineage while preserving REG-076 portability.

### Accepted Subunit 5 — Duplicate Signals, Recovery and Worker-ID Eligibility

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#66`;
- accepted base main `9f35335e206eb899e630908efc425d2727dc5d91`;
- exact implementation head `8d7d3485a4d1f8017e0b5f0dab46ef8d9be5cb8c`, exact-head full gate `31415441023` — **PASS**;
- implementation merge `538948402c703970fe6f6d84ab3a6e8cf61d8ab8`, merged-main full gate `31431146567` — **PASS**;
- closure PR `#67`, exact closure head `87a90dced3b03c79e709f8ff6ca21923c3a5fa97`, exact-head gate `31432224808` — **PASS**;
- closure merge `b7e9b7cd68a7ba4fd6227bf266c6fa89c0a2fd0a`, merged-main gate `31432693829` — **PASS**;
- browser test **NOT REQUIRED**; no visible product surface;
- permanent acceptance record `docs/testing/results/M1_07_SUBUNIT5_ACCEPTANCE.md`.

S5 accepted conservative deterministic duplicate signals derived only from accepted identity facts, no persistence of compared personal values in signal rows, append-only exact-version checks/signals/dispositions, explicit server-owned continue/recovery/review/block dispositions, no silent or automatic account/identity merge, separation from authenticated recovery authority, verified-only permanent Worker-ID eligibility, opaque/non-sequential/idempotent Worker IDs, Worker own-status isolation, immutable bounded audit and monotonic migration/restart behavior.

The first S5 complete gate exposed an isolated test-runtime dependency omission rather than a product decision defect. The S5 runtime harness now compiles the directly exercised accepted S4 modules, and the final exact-head and merged-main gates both pass.

### Active final M1.07 subunit

6. **Correction Versions, Worker Identity UX and Cumulative Acceptance — IN PROGRESS on PR `#68`.** Corrections create new versions rather than rewrite accepted history. S6 builds the real Worker-only `/worker/identity` route, accepted M1.06/S3 evidence upload and binding workflow, verified contact display, optimistic draft/submission/check/eligibility states, immutable correction lineage, stale-write and failure/recovery states, responsive/accessibility behavior, exact service-layer contracts and cumulative M1.07 automation. Its implementation head and the resulting merged `main` must each pass the complete engineering gate. The next genuine release boundary after those passes is the targeted owner/browser live test; M1.07 cannot close without owner PASS.

The cumulative visible baseline through accepted pre-S4 `main` was owner-tested and reported PASS on 10 August 2026. It does not need to be repeated for internal-only S4/S5 changes; S6 receives the new targeted live test.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | **DONE** | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | **DONE** | Accepted. |
| M1.03 | Authentication and portal isolation | **DONE** | Accepted. |
| M1.04 | Authorization and tenant isolation | **DONE** | Accepted. |
| M1.05 | Audit and notification foundations | **DONE** | Live providers remain later production activation. |
| M1.06 | Secure storage and upload pipeline | **DONE** | Accepted; production provider activation remains later. |
| M1.07 | Worker onboarding and Identity Engine | **IN PROGRESS / SUBUNITS 1-5 DONE / S6 ACTIVE** | Finish S6 exact-head automation, merge exact verified head, pass merged-main automation, then targeted owner/browser PASS and formal M1.07 closure. |
| M1.08 | Company registration and verification | **NOT STARTED / BLOCKED** | After complete M1.07 acceptance. |
| M1.09 | Sites, departments and team | **NOT STARTED / BLOCKED** | After M1.08. |
| M1.10 | Worker invitations and Company codes | **PARTIAL PREREQUISITE ONLY / BLOCKED** | Staff provisioning is not the business invitation/code workflow. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | **NOT STARTED / BLOCKED** | Requires preceding Company/Worker foundations. |
| M1.12 | Public verification foundation | **PROTOTYPE/DEMO REFERENCE ONLY / BLOCKED** | Clean-rebuild lookup/projection/concern/rate-limit/QR work remains. |

**Milestone 1 progress: 6 of 12 bricks are DONE.**

## Canonical remaining roadmap

The frozen Phase 1 roadmap contains **37 bricks total: 12 in Milestone 1, 13 in Milestone 2 and 12 in Milestone 3.** Only fully accepted bricks count as DONE.

### Milestone 2 — Assurance, Assessments, Review and Interviews

All are BLOCKED until Milestone 1 closes:

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

All are BLOCKED until Milestone 2 closes:

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

1. Finish S6 exact-head automation, merge only the exact verified implementation head, pass the complete merged-main gate, then stop at the genuine `/worker/identity` owner/browser acceptance boundary.
2. After M1.07 owner acceptance and formal closure, continue M1.08 through M1.12 in order.
3. Pass the complete Milestone 1 exit test.
4. Build M2.01 through M2.13 in order and pass Milestone 2 exit.
5. Build M3.01 through M3.12 in order and pass production-launch exit.

No later brick may be pulled forward merely because prototype code once displayed it.