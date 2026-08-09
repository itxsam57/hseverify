# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and accepted-brick record for the HSE Verify Phase 1 clean rebuild.

The controlling product source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, Version 10 code, chats and discarded implementations may explain intent but cannot override the frozen specification or accepted clean-rebuild evidence.

`docs/NEXT_BUILD_UNIT.md` is the exact current subunit gate. This file and `docs/NEXT_BUILD_UNIT.md` must agree before the engineering gate may pass.

## Brick gate

A brick is DONE only after:

1. complete canonical implementation;
2. complete automated validation;
3. server-side permission/ownership/tenant enforcement where applicable;
4. migration/rollback/recovery evidence where applicable;
5. exact owner hard testing for genuinely visible behavior;
6. clean synchronized Git state and accepted merged-main verification;
7. no unresolved release-blocking defect;
8. a committed closure/acceptance record.

The next brick may not begin before the current brick is DONE. Internal subunits may advance only through their own defined gates.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

- **Owner result:** PASS — 2 August 2026.
- **Boundary:** accepted vertical slice only; M1.07 remains incomplete and blocked until M1.06 closes.

### M1.01 — Repository, Environments and CI/CD

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #5, PR #6 and PR #7.
- **Maintenance:** `LATER-044` retains tested PostCSS/Sharp compatibility overrides.

### M1.02 — Design System and Global UX

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #8 through PR #14.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 — Authorization and Tenant Isolation

- **Status:** DONE — OWNER PASS — 6 August 2026.
- **Final implementation PR:** #34.
- **Final implementation merge:** `4329a591dfa7d1e7c4fca3feb5dd33c873984574`.
- **Owner-tested commit:** `56973430099171ebc48d2f4cc96887b58486167b`.
- **Final merged-main control run/job:** `31070230847` / `92516468358` — PASS.
- **Final record:** `docs/testing/results/M1_04_FINAL_OWNER_ACCEPTANCE.md`.

Accepted M1.04 boundary includes explicit wildcard-free permission matrices, fixed-role direct-endpoint isolation, trusted Company tenant context from the database session, tenant predicates in every accepted tenant-owned SQL operation, transactional authority revalidation, non-enumerating cross-tenant behavior, protected Company-scope demonstration, concurrency coverage and deterministic migration/rollback/reopen proof.

### M1.05 — Audit and Notification Foundations

- **Status:** DONE — OWNER PASS — 9 August 2026.
- **Accepted boundary:** immutable append-only platform audit facts; transactional durable outbox/background worker; persisted in-app notifications/read state/exact role-safe deep links; provider-neutral durable email delivery queue with immutable attempt history, bounded retry/reclaim/terminal behavior and local/test adapter.
- **Live email provider activation:** remains provider-blocked for M3.10 and is not part of the accepted local/test M1.05 gate.

## Current brick

# M1.06 — Secure Storage and Upload Pipeline

**Status: IN PROGRESS — only permitted Milestone 1 brick.**

Last accepted canonical `main` boundary before Subunit 4:

`d4acee0093c2d1cd540fc944c1937183dd3afa8a`

### Accepted M1.06 subunits

1. **Secure File Domain, Metadata Schema and Private Object Storage Adapter — DONE — ENGINEERING PASS — 9 August 2026.**
   - Private secure-file metadata/domain.
   - Server-generated opaque file/object identity.
   - Local/test private object-storage adapter.
   - Account/role/Company tenant isolation and immutable provenance.
   - Traversal/symlink and migration/recovery protections.

2. **Isolated Upload Intake, Validation and Quarantine — DONE — ENGINEERING PASS — 9 August 2026.**
   - PDF/PNG/JPEG extension, declared MIME, detected structure/signature and size validation at trusted boundaries.
   - Private quarantine and exact server-derived object binding.
   - SHA-256/size persistence, staged-byte retry recovery, cross-file/concurrent upload isolation and material audit persistence.

3. **Durable Malware Scan Job and Local/Test Scanner Adapter — DONE — ENGINEERING PASS — 10 August 2026.**
   - Fixed `secure_file.scan` outbox job and exact scan-generation/job binding.
   - Durable worker retry/lease/reclaim/terminal recovery.
   - Local/test clean/EICAR/retry/terminal scanner fixtures.
   - Private-object SHA-256/size revalidation and guarded `scan_pending -> available|unsafe|scan_failed` transitions.
   - Trusted lease capability and consistent outbox-before-file lock order.

### Active M1.06 subunit

4. **Authorized Signed Preview/Download Pipeline — IN PROGRESS — PR #53.**
   - Exact current requirements and acceptance gate are in `docs/NEXT_BUILD_UNIT.md`.
   - It is not DONE until exact-head full engineering gate, merge, merged-main full gate and any applicable owner acceptance pass.

5. **Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — BLOCKED** until Subunit 4 closes.

M1.07 and later bricks remain blocked while M1.06 is incomplete.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | **DONE** | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | **DONE** | Accepted 2 August 2026. |
| M1.03 | Authentication and portal isolation | **DONE** | Accepted 4 August 2026. |
| M1.04 | Authorization and tenant isolation | **DONE** | Accepted 6 August 2026. |
| M1.05 | Audit and notification foundations | **DONE** | Live provider activation is later M3.10 work, not an M1.05 acceptance gap. |
| M1.06 | Secure storage and upload pipeline | **IN PROGRESS** | Subunit 4 signed access, then Subunit 5 cumulative acceptance. |
| M1.07 | Worker onboarding and Identity Engine | **PARTIAL SLICE ACCEPTED / BRICK BLOCKED** | Existing Dashboard/Profile slice does not complete identity upload, liveness, duplicate checks or Worker ID issuance. Resume after M1.06. |
| M1.08 | Company registration and verification | **NOT STARTED / BLOCKED** | M1.04 provides tenant security foundation only. |
| M1.09 | Sites, departments and team | **NOT STARTED / BLOCKED** | Requires accepted M1.08 Company workflow. |
| M1.10 | Worker invitations and Company codes | **PARTIAL PREREQUISITE ONLY / BLOCKED** | M1.03 staff provisioning is not the Worker/Company invitation-code business workflow. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | **NOT STARTED / BLOCKED** | Requires M1.06 secure files and preceding Company/Worker foundations. |
| M1.12 | Public verification foundation | **PROTOTYPE/DEMO REFERENCE ONLY / BLOCKED** | Clean-rebuild real lookup, safe projection, concern reporting, rate limits and QR base are not accepted. |

**Milestone 1 progress: 5 of 12 bricks are DONE.**

## Canonical remaining roadmap

The frozen Phase 1 roadmap contains **37 bricks total: 12 in Milestone 1, 13 in Milestone 2 and 12 in Milestone 3.** Only fully accepted bricks count as DONE.

### Milestone 2 — Assurance, Assessments, Review and Interviews

All Milestone 2 bricks are **BLOCKED** until the complete Milestone 1 exit gate passes.

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

All Milestone 3 bricks are **BLOCKED** until Milestone 2 is accepted.

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

A Worker can securely register, verify contact information, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal isolation, tenant isolation, audit and secure uploads pass security testing.

### Milestone 2 exit

A complete assurance case can run end-to-end through evidence verification, randomized/non-repeating assessment delivery, durable answer recovery, integrity monitoring, written review, interview and final decision without cross-role/cross-tenant leakage or lost state.

### Milestone 3 exit

Credentials, living records, sharing, company operations, billing/reporting, appeals/privacy/accessibility, production providers, load/security/recovery certification and production handover are complete and release-ready.

## Correct execution order

1. Finish M1.06 Subunit 4 and its exact acceptance gate.
2. Finish M1.06 Subunit 5 and close M1.06 as a brick.
3. Continue M1.07 through M1.12 in order.
4. Pass the complete Milestone 1 exit test.
5. Build M2.01 through M2.13 in order and pass Milestone 2 exit.
6. Build M3.01 through M3.12 in order and pass production-launch exit.

No later brick may be pulled forward merely because prototype code once displayed it.
