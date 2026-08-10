# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and accepted-brick record for the HSE Verify Phase 1 clean rebuild.

The controlling product source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, Version 10 code, chats and discarded implementations may explain intent but cannot override the frozen specification or accepted clean-rebuild evidence.

`docs/NEXT_BUILD_UNIT.md` is the exact current subunit gate. This file and `docs/NEXT_BUILD_UNIT.md` must agree before the engineering gate may pass.

## Brick gate

A brick is DONE only after complete canonical implementation, automated validation, server-side permission/ownership/tenant enforcement where applicable, migration/rollback/recovery evidence where applicable, owner testing for genuinely visible behavior, clean synchronized Git state, merged-main verification, no unresolved release-blocking defect and a committed closure record.

The next brick may not begin before the current brick is DONE. Internal subunits may advance only through their own defined gates.

## Accepted bricks and owner gates

- Worker Dashboard and Worker Profile vertical slice — **OWNER PASS — 2 August 2026**; accepted slice only, not complete M1.07.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.

M1.04 accepted explicit permission matrices, fixed-role direct-endpoint isolation, trusted Company tenant context, tenant predicates in tenant-owned SQL, transactional authority revalidation, non-enumerating cross-tenant behavior, protected Company-scope demonstration, concurrency and deterministic migration/rollback/reopen proof.

M1.05 accepted immutable audit facts, transactional durable outbox/background work, persisted role-safe in-app notifications and provider-neutral durable email delivery with local/test adapter. Live provider activation remains M3.10 work.

## Current brick

# M1.06 — Secure Storage and Upload Pipeline

**Status: IN PROGRESS — only permitted Milestone 1 brick.**

Current accepted canonical main boundary before Subunit 5 implementation:

`2a9ccd2d3fb7bf3292635482bc378335d4e5c6d4`

### Accepted M1.06 subunits

1. **Secure File Domain, Metadata Schema and Private Object Storage Adapter — DONE — ENGINEERING PASS — 9 August 2026.**
   - relational private metadata, server-generated opaque identity/object keys, local/test private storage, account/role/Company scope, traversal/symlink and migration/restart protections.

2. **Isolated Upload Intake, Validation and Quarantine — DONE — ENGINEERING PASS — 9 August 2026.**
   - independent PDF/PNG/JPEG extension/MIME/structure/size checks, private quarantine, SHA-256/size provenance, retry and cross-file/concurrency isolation.

3. **Durable Malware Scan Job and Local/Test Scanner Adapter — DONE — ENGINEERING PASS — 10 August 2026.**
   - fixed shared outbox job, scan-generation binding, retry/lease/reclaim/terminal recovery, deterministic clean/EICAR/retry fixtures, private-object revalidation and guarded result lifecycle.

4. **Authorized Signed Preview/Download Pipeline — DONE — ENGINEERING PASS — 10 August 2026.**
   - implementation PR `#53`, validated head `b370142658238b47d842366f1af343f72533d0b1`;
   - exact-head gate `31354949426 / 93352838153` — PASS;
   - implementation merge `d03ce5322c2ffa0214c90ee5dc19c15e22da9d51` and merged-main gate `31355234897 / 93353573069` — PASS;
   - formal closure PR `#54`, exact closure gate `31355933273` — PASS;
   - closure merge `2a9ccd2d3fb7bf3292635482bc378335d4e5c6d4` and merged-main closure gate `31356210231` — PASS;
   - no browser-visible surface, therefore no owner browser test required;
   - final record `docs/testing/results/M1_06_SIGNED_ACCESS_FINAL_ACCEPTANCE.md`;
   - permanent regressions `REG-055` through `REG-069`.

### Active M1.06 subunit

5. **Complete M1.06 Isolation, Migration, Recovery and Acceptance — IN PROGRESS — `build/m1-06-final-acceptance`.**

This final unit does not add a later product workflow. It composes the accepted secure-file domain, private storage, upload/quarantine, durable scan, audit/outbox and signed-access foundations on one real local/test persistence boundary and proves isolation, malicious/tampered content denial, restart durability and cumulative migration recovery. Its exact scope and acceptance gate are in `docs/NEXT_BUILD_UNIT.md`.

M1.07 and later bricks remain blocked while M1.06 is incomplete.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | **DONE** | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | **DONE** | Accepted. |
| M1.03 | Authentication and portal isolation | **DONE** | Accepted. |
| M1.04 | Authorization and tenant isolation | **DONE** | Accepted. |
| M1.05 | Audit and notification foundations | **DONE** | Live providers remain later production activation. |
| M1.06 | Secure storage and upload pipeline | **IN PROGRESS** | Subunit 5 cumulative lifecycle/isolation/restart/migration acceptance, exact-head gate, merge, merged-main gate and separate brick closure. |
| M1.07 | Worker onboarding and Identity Engine | **PARTIAL SLICE ACCEPTED / BRICK BLOCKED** | Identity upload, liveness, duplicate checks and permanent Worker ID remain. Resume only after M1.06. |
| M1.08 | Company registration and verification | **NOT STARTED / BLOCKED** | After M1.07. |
| M1.09 | Sites, departments and team | **NOT STARTED / BLOCKED** | After M1.08. |
| M1.10 | Worker invitations and Company codes | **PARTIAL PREREQUISITE ONLY / BLOCKED** | Staff provisioning is not the business invitation/code workflow. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | **NOT STARTED / BLOCKED** | Requires preceding Company/Worker foundations. |
| M1.12 | Public verification foundation | **PROTOTYPE/DEMO REFERENCE ONLY / BLOCKED** | Clean-rebuild lookup/projection/concern/rate-limit/QR work remains. |

**Milestone 1 progress: 5 of 12 bricks are DONE.**

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

1. Finish M1.06 Subunit 5 and close M1.06 as a brick.
2. Continue M1.07 through M1.12 in order.
3. Pass the complete Milestone 1 exit test.
4. Build M2.01 through M2.13 in order and pass Milestone 2 exit.
5. Build M3.01 through M3.12 in order and pass production-launch exit.

No later brick may be pulled forward merely because prototype code once displayed it.
