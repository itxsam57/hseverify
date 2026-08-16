# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. Frozen authority remains **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records permanent order and accepted history.

## Accepted release beneath the active brick

- M1.01 — DONE — OWNER PASS.
- M1.02 — DONE — OWNER PASS.
- M1.03 — DONE — OWNER PASS.
- M1.04 — DONE — OWNER PASS.
- M1.05 — DONE — OWNER PASS.
- M1.06 — DONE — ENGINEERING PASS.
- M1.07 — DONE — OWNER PASS — 11 August 2026.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
- M1.09 Sites, Departments and Company Team — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.

M1.08 release evidence:
- PR `#74`;
- exact verified head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`;
- exact-head full gate `31476983323` — PASS;
- expected-head-locked merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`;
- merged-main full gate `31483852831` — PASS.

M1.09 release evidence:
- PR `#75`;
- exact verified head `32130f82b661b86d7ad08f5dad7a368346cfe13d`;
- exact-head full gate `31569523799` — PASS;
- expected-head-locked merge `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`;
- merged-main full gate `31569898065` — PASS.

The owner explicitly superseded the earlier M1.08+M1.09 browser stop and requested one combined **Milestone 1** browser acceptance after M1.10, M1.11 and M1.12 are also built. This is a test deferral, not an owner PASS. Formal Milestone 1 DONE count therefore remains **7 of 12** until that combined acceptance succeeds.

## Current build gate

# M1.10 — WORKER INVITATIONS AND COMPANY CODES — IN PROGRESS

M1.10 is the **only permitted product brick** now.

### Canonical outcome

A verified active Company can invite one or many Workers, create bounded Company registration codes, apply active same-tenant Site/Department and payment defaults, and link a verified Worker account to the Company without transferring ownership of the Worker identity. Existing Worker registration/contact-verification and Worker-ID authority must be reused rather than duplicated.

### Non-negotiable controls

1. Company authority is server-derived from the live Company tenant membership and `company.workforce.manage`; browser-supplied tenant/actor authority is never trusted.
2. Worker invitation and registration-code secrets are high-entropy/controlled, hashed at rest, expiring and revocable. Raw values are exposed only at an authorized delivery/copy boundary.
3. Site/Department defaults must belong to the same tenant and be active at creation and redemption; archived/cross-tenant units cannot receive new links.
4. Worker identity remains portable. Company linking creates a Company↔Worker relationship; it never converts the Worker into a Company staff membership and never gives the Company ownership of the Worker identity.
5. Existing Worker acceptance binds the authenticated Worker. New Worker redemption integrates with the accepted mandatory email+phone verification path before link activation.
6. Duplicate active links, replayed invitation redemption and duplicate bulk rows are idempotent/conflict-safe under concurrency.
7. Registration codes enforce expiry, active/paused/revoked state and usage limits transactionally.
8. Single/bulk invitation supports employee ID, Site/Department defaults, payment responsibility, expiry and bounded future assessment-reference metadata without starting M2 assessment logic.
9. Resend is rate-limited; unused invitations/codes can be revoked. Bulk CSV validation returns row-level errors and does not partially corrupt accepted rows.
10. Material invitation/code/link mutations are immutable-audited in the same transaction and project notifications/outbox jobs where another user must act.
11. Cross-tenant copied IDs/tokens/codes fail safely without enumeration. Worker private identity/evidence is not exposed by invitation or directory-link plumbing.
12. Permanent runtime, migration/restart, concurrency, tenant-isolation and registration-redemption regressions are required.
13. M1.11, M1.12 and M2+ implementation remain blocked while M1.10 is active.

## Explicitly blocked while M1.10 is active

- M1.11 Employment, Experience, Qualification, Skill and Leaving Records.
- M1.12 Public Verification Foundation.
- M2.01–M2.13.
- M3.01–M3.12.
- Fake production activation of email/SMS/private-object/malware/liveness/face/document/video/payment providers.

## M1.10 release gate

Before advancing to M1.11:
1. finish M1.10 implementation and permanent regressions;
2. pass complete exact-head engineering gate;
3. merge only that exact verified head;
4. pass complete merged-main engineering gate;
5. recheck `main` did not move during verification.

Owner/browser acceptance remains deferred to the combined Milestone 1 acceptance requested by the owner. Engineering-green M1.10 may advance to M1.11 without an intermediate browser stop.

## Permanent procedure

Root-cause fixes only. Never weaken an accepted test or historical constraint to fit new code. Keep one active brick. Use exact-head CI, expected-head merge locks and merged-main verification. Owner/browser PASS must always be tied to an exact release.