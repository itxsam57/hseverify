# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and acceptance record for HSE Verify Phase 1.

The controlling source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, chats and summaries may explain intent but do not override that specification.

No pull request, implementation note or next-step file may silently change this path.

## Brick gate

A brick is DONE only after:

1. complete canonical implementation;
2. passing automated validation;
3. passing owner hard testing;
4. clean repository and rollback evidence;
5. no unresolved release-blocking owner defect.

The next brick may not begin before the current brick is DONE. Internal subunits inside one brick may proceed only in documented order and may not claim the whole brick complete.

## Status meanings

- **DONE** — implementation, automated validation and owner hard test passed.
- **IMPLEMENTED — OWNER TEST PENDING** — code and CI are complete, but owner acceptance is incomplete.
- **IMPLEMENTED — OWNER RETEST REQUIRED** — owner testing found a defect and the repair still needs targeted retest.
- **PARTIAL** — some accepted or implemented behavior exists, but the canonical brick is incomplete.
- **IN PROGRESS** — active implementation without complete brick validation.
- **NOT STARTED** — canonical work has not begun.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

- **Owner result:** PASS
- **Accepted:** 2 August 2026
- **Accepted units:** Worker Dashboard, Profile/onboarding continuation, persisted Profile save/restart, stale-form conflict and sensitive-field correction boundary.
- **Boundary:** these units remain part of M1.07; M1.07 is still PARTIAL until the complete Identity Engine passes.

### M1.01 — Repository, environments and CI/CD

- **Status:** DONE
- **Owner result:** PASS
- **Accepted:** 2 August 2026
- **Implementation chain:** PR #5, PR #6 and PR #7.
- **Accepted:** environment separation, PGlite/PostgreSQL adapters, deterministic migrations, database-backed Profile storage, Windows runtime, secure dependency floors, production audit, release artifact, rollback and clean owner state.
- **Maintenance:** `LATER-044` remains for the explicit PostCSS/Sharp compatibility overrides.

### M1.02 — Design System and Global UX

- **Status:** DONE
- **Owner result:** PASS
- **Accepted:** 2 August 2026
- **Implementation chain:** PR #8 through PR #14.
- **Accepted:** shared design system, responsive shell, accessible controls/table/dialog contracts, deterministic development/type/runtime/build/preview isolation, Windows portability and Worker Profile width containment.
- **Owner matrix:** normal desktop, 860px, 768px, 390px, 320px, 125%, 150%, 200% and additional successful zoom testing through 500%.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 internal subunit 1 — Authentication security foundation

- **Status:** OWNER ACCEPTED
- **Owner result:** PASS
- **Accepted:** 2 August 2026
- **Pull request:** #15
- **Squash merge:** `1472ea94118507320cef5c33412cc260e55c3916`
- **Final record:** `docs/testing/results/M1_03_AUTHENTICATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`
- **Accepted:** persistent authentication schema, verified lifecycle constraints, assigned-role sessions, OTP challenge state, staff invitation/TOTP state, cryptographic primitives, PGlite/PostgreSQL transactions, transactional repository operations, rollback boundary and Windows clean-state evidence.
- **Boundary:** this is an accepted internal subunit only. It does not mark M1.03 DONE.

## Current brick

### M1.03 — Authentication and Portal Isolation

**Status: IN PROGRESS**

M1.03 is the only permitted implementation brick. M1.04 is blocked.

#### Internal subunit 1 — authentication security foundation

- **Pull request:** #15
- **Squash merge:** `1472ea94118507320cef5c33412cc260e55c3916`
- **Status:** OWNER ACCEPTED
- **Documentation:** `docs/M1_03_AUTHENTICATION_FOUNDATION.md`
- **Merged evidence:** `docs/testing/results/M1_03_AUTHENTICATION_FOUNDATION_MERGED.md`
- **Final owner evidence:** `docs/testing/results/M1_03_AUTHENTICATION_FOUNDATION_FINAL_OWNER_ACCEPTANCE.md`

Accepted implementation:

1. Migration `0002_authentication_foundation`.
2. Persistent accounts and explicit account-role assignments.
3. Verified account lifecycle and lock-state database constraints.
4. Expiring, attempt-limited and replay-safe OTP challenge state.
5. Opaque, revocable sessions bound to one assigned account role.
6. Active-account-only session creation and lookup.
7. Staff invitation state.
8. Encrypted TOTP factor state and replay counter.
9. Authentication-specific append-only security events.
10. Six canonical roles: Worker, Company, assessor, verifier, administrator and root/super-admin.
11. Separate login/home route contracts with no session role switching.
12. Mandatory MFA classification for all non-Worker roles.
13. Scrypt password hashing, challenge-bound OTP hashing and context-separated opaque token hashing.
14. TOTP generation/verification and authenticated secret encryption.
15. Native PGlite and PostgreSQL transaction support.
16. Transactional repository contracts for verification, sessions, lockout and security events.
17. Permanent cryptographic, migration, lifecycle, assigned-role, transaction and rollback tests inside `npm run check`.
18. Windows owner validation of focused tests, complete application gate, disposable migration/rollback and clean repository state.

This accepted subunit must not be weakened by later registration, session or portal work.

#### Internal subunit 2 — Worker registration and mandatory contact verification

- **Status:** READY TO BUILD
- **Gate:** only this M1.03 subunit may proceed.

Required boundary:

1. Real Worker registration form and safe duplicate-account handling.
2. Atomic `pending_email` account creation with Worker role and provisional registration reference.
3. Sandbox email OTP delivery, expiry, resend cooldown, attempt exhaustion, invalidation and replay prevention.
4. Transition to `pending_phone` only after email verification.
5. Sandbox phone OTP delivery, expiry, resend cooldown, attempt exhaustion, invalidation and replay prevention.
6. Transition to `active` only after both contacts are verified and a valid password exists.
7. Authentication security events for every transition and denial.
8. Refresh/back/restart recovery without duplicate accounts or lost verification state.
9. No plaintext OTP in persistent storage, browser storage, logs or normal responses.
10. Permanent automated and Windows owner testing before subunit 3 begins.

#### Remaining internal subunit order

3. Password sign-in, lockout, reset, recovery and lifecycle.
4. Opaque database session-cookie integration, device list and revocation.
5. Staff invitation acceptance and TOTP enrollment.
6. Separate login pages and protected layouts for Company, assessor, verifier, administrator and root.
7. Cross-role navigation, copied-URL, direct-endpoint and stale-session denial suite.
8. Complete M1.03 Windows owner acceptance and rollback.

M1.03 remains IN PROGRESS until every internal subunit and the final brick owner test pass.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Compatibility override maintenance remains under LATER-044. |
| M1.02 | Design system and global UX | DONE | Accepted 2 August 2026. |
| M1.03 | Authentication and portal isolation | IN PROGRESS | Foundation accepted; complete registration/OTP, recovery, sessions, staff MFA, role portals and the final denial matrix. |
| M1.04 | Authorization and tenant isolation | NOT STARTED | Permission model, Company tenancy, query/command guards and cross-tenant denial tests. |
| M1.05 | Audit and notification foundations | PARTIAL | Full immutable audit, outbox/jobs, persisted notifications, email queue and delivery state. Authentication security events do not replace this brick. |
| M1.06 | Secure storage and upload pipeline | NOT STARTED | Private storage, independent upload state, file validation, quarantine/scan and signed preview. |
| M1.07 | Worker onboarding and Identity Engine | PARTIAL | Dashboard/Profile accepted; contact integration, identity evidence, liveness, duplicate detection and permanent Worker ID issuance remain. |
| M1.08 | Company registration and verification | NOT STARTED | Tenant creation, first administrator, verification case and settings. |
| M1.09 | Sites, departments and team | NOT STARTED | Combined management, archival and scoped team permissions. |
| M1.10 | Worker invitations and Company codes | PARTIAL | M1.03 staff provisioning schema does not complete Worker invitations or Company codes. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | NOT STARTED | Integrated records, uploads, verification states and retained history. |
| M1.12 | Public verification foundation | PARTIAL PROTOTYPE | Real lookup, safe projection, concern reporting, rate limits and QR base. |

## Correct execution order

1. Complete and owner-accept M1.03.
2. Complete and owner-accept M1.04.
3. Complete and owner-accept M1.05.
4. Complete and owner-accept M1.06.
5. Resume and complete M1.07.
6. Continue M1.08 through M1.12 in order.
7. Pass the complete Milestone 1 exit test.
8. Start Milestone 2 only after Milestone 1 is DONE.

## Canonical three-milestone roadmap

### Milestone 1 — Platform Foundation, Identity and Company Trust

1. M1.01 Repository, environments and CI/CD.
2. M1.02 Design system and global UX.
3. M1.03 Authentication and portal isolation.
4. M1.04 Authorization and tenant isolation.
5. M1.05 Audit and notification foundations.
6. M1.06 Secure storage and upload pipeline.
7. M1.07 Worker onboarding and Identity Engine.
8. M1.08 Company registration and verification.
9. M1.09 Sites, departments and team.
10. M1.10 Worker invitations and Company codes.
11. M1.11 Employment, experience, qualification, skill and leaving-letter records.
12. M1.12 Public verification foundation.

**Milestone 1 exit gate:** a Worker can securely register, verify email and phone, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal isolation, tenant isolation, audit and secure uploads must pass security testing.

### Milestone 2 — Assurance, Assessments, Review and Interviews

M2.01 through M2.15 remain frozen in the master specification. They include Assurance Cases, evidence verification, framework/policy control, MCQ and written Question Bank, randomized non-repeating assessment generation, candidate assessment window, answer persistence/recovery, proctoring, scoring/review, interviews, decisions, appeals and credential issuance.

### Milestone 3 — Operations, Billing, Intelligence and Production Launch

M3.01 through M3.10 remain frozen in the master specification. They include reassessment/renewal, payments/payouts, subscriptions, finance, reporting, advanced administration, security/compliance hardening, performance/accessibility and production activation.
