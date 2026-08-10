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

## Current brick

# M1.07 — Worker Onboarding and Identity Engine

**Status: IN PROGRESS — Subunits 1 and 2 accepted; Subunit 3 is next.**

The accepted Worker Dashboard/Profile vertical slice is a reusable prerequisite, not the full Identity Engine. M1.07 adds a separate versioned identity domain, secure M1.06 evidence binding, deterministic automated checks/provider boundaries, duplicate-signal handling, permanent Worker-ID eligibility/issuance, correction history and the real `/worker/identity` Worker UX. Reviewer-facing verification queues remain M2.02.

### Accepted Subunit 1 — Identity Domain, Versioned Persistence and State Machine

**DONE — ENGINEERING PASS — 10 August 2026.**

Evidence:

- PR `#57`, exact implementation head `f7ca497d5becdf7f0a828943c833a8e8915278b6`, exact-head gate `31374028751` — **PASS**;
- merge `19a5ccc877834e78a6568a75099484aebdec0d1c`, merged-main gate `31374492294` — **PASS**;
- closure PR `#58`, exact closure head `b1ee6887775371874c743ef4c9fea2461b869799`, gate `31375874361` — **PASS**;
- closure merge `056a33578a70bc5e6412c861ce28fbd2ae76d40f`, merged-main gate `31376271877` — **PASS**;
- no browser test required; no visible product surface;
- REG-073 protects authentication rollback independence; REG-074 protects dependency-injected runtime isolation.

### Accepted Subunit 2 — Worker Identity Draft and Verified Contact Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

Evidence:

- PR `#59`;
- exact implementation head `29350dd47b51471462e21cdebbe6f5b67ebc2c18`;
- exact-head full gate `31378294472` — **PASS**;
- merge `61bdbde805ac4e27ade7a9c787559ff87b2dfb9d`;
- merged-main full gate `31378748392` — **PASS**;
- no browser test required; no visible product route/UI;
- permanent acceptance record `docs/testing/results/M1_07_SUBUNIT2_ACCEPTANCE.md`.

S2 accepted version-owned partial personal facts; live server-derived verified email/phone snapshots; SQL overwrite/revalidation against authentication authority; independent optimistic draft revisions; submission blocking for incomplete/stale personal/contact facts; monotonic restart/rollback behavior; and migration-ceiling isolation for accepted S1 layer tests.

The exact remaining M1.07 internal build order and boundaries are defined in `docs/NEXT_BUILD_UNIT.md`. **Subunit 3 — Secure Identity Document, Profile Photo and Selfie Evidence Binding** is next. M1.08 remains blocked.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | **DONE** | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | **DONE** | Accepted. |
| M1.03 | Authentication and portal isolation | **DONE** | Accepted. |
| M1.04 | Authorization and tenant isolation | **DONE** | Accepted. |
| M1.05 | Audit and notification foundations | **DONE** | Live providers remain later production activation. |
| M1.06 | Secure storage and upload pipeline | **DONE** | Accepted; production provider activation remains later. |
| M1.07 | Worker onboarding and Identity Engine | **IN PROGRESS / SUBUNITS 1-2 DONE** | Secure identity evidence, automated checks/liveness adapter, duplicate resolution, Worker ID, corrections and full Worker UX remain. |
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

1. Complete and fully accept all remaining M1.07 subunits; stop at the genuine owner/browser acceptance boundary in the final visible subunit.
2. After M1.07 owner acceptance and formal closure, continue M1.08 through M1.12 in order.
3. Pass the complete Milestone 1 exit test.
4. Build M2.01 through M2.13 in order and pass Milestone 2 exit.
5. Build M3.01 through M3.12 in order and pass production-launch exit.

No later brick may be pulled forward merely because prototype code once displayed it.
