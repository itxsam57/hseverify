# Bookmark: Milestone Path

## Authority

Permanent build-order and accepted-brick record for the HSE Verify Phase 1 clean rebuild. Frozen product authority: **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/NEXT_BUILD_UNIT.md` is the exact current gate.

A brick is formally DONE only after implementation, complete automated release gates, exact-head merge discipline, merged-main verification and owner/browser acceptance where visible behavior requires it.

## Milestone 1 status

| Brick | Capability | Status |
|---|---|---|
| M1.01 | Repository, environments and CI/CD | **DONE — OWNER PASS** |
| M1.02 | Design system and global UX | **DONE — OWNER PASS** |
| M1.03 | Authentication and portal isolation | **DONE — OWNER PASS** |
| M1.04 | Authorization and tenant isolation | **DONE — OWNER PASS** |
| M1.05 | Audit and notification foundations | **DONE — OWNER PASS** |
| M1.06 | Secure storage and upload pipeline | **DONE — ENGINEERING PASS** |
| M1.07 | Worker onboarding and Identity Engine | **DONE — OWNER PASS** |
| M1.08 | Company registration and verification | **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED** |
| M1.09 | Sites, departments and Company Team | **IN PROGRESS — PR #75** |
| M1.10 | Worker invitations and Company codes | **BLOCKED** |
| M1.11 | Employment/evidence records | **BLOCKED** |
| M1.12 | Public verification foundation | **BLOCKED** |

**Formal Milestone 1 progress: 7 of 12 bricks are DONE.** M1.08 is not counted DONE until the combined M1.08 + M1.09 owner/browser test passes.

## M1.07 accepted release

Final accepted release `4858c05fcab9d8e4fa4cc09d4cfc2243dc313177`, merged-main gate `31447079334`, owner/browser PASS 11 August 2026. REG-073 through REG-079 remain permanent as applicable.

## M1.08 engineering release

- PR `#74`.
- Exact verified head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`.
- Exact-head full gate `31476983323` — PASS.
- Expected-head-locked merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`.
- Merged-main full gate `31483852831` — PASS.
- Owner/browser acceptance intentionally deferred to the combined M1.08 + M1.09 test; this is not a PASS.

## M1.09 active gate

M1.09 is the only active product brick. It owns:
- one combined tenant-scoped Sites and Departments interface;
- required unit fields and revision-safe changes;
- archive/restore where archive ends active assignments without deleting historical assignment records;
- archived units cannot receive new active assignments;
- Company Team kept separate from Worker directory;
- Company staff invitation through the existing M1.03 password/TOTP enrollment path;
- server-owned tenant role, site, department and permission authority;
- no user can grant a role above the accepted role matrix or a permission they do not possess;
- immutable audit and permanent concurrency/isolation regressions.

M1.10 Worker invitations/company codes is explicitly outside M1.09 and remains blocked.

## Canonical remaining roadmap

The frozen roadmap contains **37 bricks total: 12 in Milestone 1, 13 in Milestone 2 and 12 in Milestone 3.**

### Milestone 2 — all BLOCKED
M2.01 — Assurance Order and Case Engine
M2.02 — Evidence Verification Queues
M2.03 — Frameworks and Effective Policy
M2.04 — Question Bank
M2.05 — Randomized Assessment Form Generation
M2.06 — Assessment Catalogue and Eligibility
M2.07 — Candidate Assessment Window
M2.08 — Answer Persistence and Interruption Recovery
M2.09 — Integrity Engine
M2.10 — Written Scoring and Review Engine
M2.11 — Interview Scheduling and Assignment
M2.12 — Interview Console and Playbook
M2.13 — Decision Engine

### Milestone 3 — all BLOCKED
M3.01 — Credential and QR Issuance
M3.02 — Digital Passport and Living Record
M3.03 — Scoped Share Links
M3.04 — Company Action Centre and Analytics
M3.05 — Billing and Subscriptions
M3.06 — Reports and Delivery
M3.07 — Appeals, Renewal, Suspension and Revocation
M3.08 — Admin Operational Completeness
M3.09 — Privacy and Accessibility Operations
M3.10 — Production Integrations
M3.11 — Load, Security and Recovery Certification
M3.12 — Production Launch and Operational Handover

## Correct execution order

1. Finish M1.09 engineering release on exact-head and merged-main gates.
2. Run one combined owner/browser acceptance for M1.08 + M1.09 as requested by the owner.
3. Only after combined PASS, record M1.08 and M1.09 closure and unlock M1.10.
4. Continue M1.10–M1.12, then M2.01–M2.13, then M3.01–M3.12.

No prototype or later-brick code may bypass this order.
