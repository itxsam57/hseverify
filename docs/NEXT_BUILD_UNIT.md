# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen authority remains **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records permanent build order and accepted history.

## Accepted release beneath the active brick

- M1.01 — DONE — OWNER PASS.
- M1.02 — DONE — OWNER PASS.
- M1.03 — DONE — OWNER PASS.
- M1.04 — DONE — OWNER PASS.
- M1.05 — DONE — OWNER PASS.
- M1.06 — DONE — ENGINEERING PASS.
- M1.07 — DONE — OWNER PASS — 11 August 2026.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED M1.08 + M1.09 TEST**.

M1.08 release evidence:
- PR `#74`;
- exact verified head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`;
- exact-head full gate `31476983323` — PASS;
- expected-head-locked merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`;
- merged-main full gate `31483852831` — PASS.

The owner explicitly requested that M1.08 and M1.09 be browser-tested together. This is a test deferral, not an owner PASS. Therefore the formal Milestone 1 DONE count remains **7 of 12** until the combined owner test succeeds.

## Current build gate

# M1.09 — SITES, DEPARTMENTS AND COMPANY TEAM — IN PROGRESS — PR #75

M1.09 is the **only permitted product brick** now.

### Canonical outcome

A verified active Company can maintain its tenant-scoped Sites and Departments through one combined interface and can invite/manage Company Team members separately from Workers. Site/department archive preserves history and ends active assignments rather than deleting them. Company Team onboarding must reuse the accepted M1.03 invitation/password/TOTP path and M1.04 tenant membership/permission authority.

### Non-negotiable controls

1. Sites and Departments are tenant-owned durable records with opaque identifiers and exact database tenant predicates.
2. Site/Department fields include name, formatted address, phone, website, email and optional registration number.
3. Archival requires confirmation, keeps the unit visible as archived, ends active assignments and preserves assignment history.
4. Archived units cannot receive new active assignments; restore never resurrects historical assignments automatically.
5. Company Team is separate from the Worker directory and M1.10 Worker invitation/company-code workflow.
6. Company staff onboarding reuses existing `auth_staff_invitations` and `/staff/invite/<token>` password/TOTP enrollment. No parallel staff authentication stack is allowed.
7. Team role, site, department and permission authority is derived server-side from the current Company tenant membership.
8. No Company user may grant a role above the accepted role-grant matrix or a permission they do not currently possess.
9. Material organization/team mutations must be immutable-audited in the same transaction as state change.
10. Cross-tenant copied identifiers must fail non-enumerating at server/database boundaries.
11. Concurrency, archive/history, invitation/MFA activation and permission ceilings require permanent runtime regressions.
12. M1.10 and later business implementation remains blocked.

## Explicitly blocked while M1.09 is active

- M1.10 Worker Invitations and Company Codes.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records.
- M1.12 Public Verification Foundation.
- M2.01–M2.13.
- M3.01–M3.12.
- Fake production activation of email/SMS/private-object/malware/liveness/face/document/video/payment providers.

## M1.09 release gate

Before asking the owner for the combined M1.08 + M1.09 browser test:
1. finish M1.09 implementation and permanent regressions;
2. pass complete exact-head engineering gate;
3. merge only that exact verified head;
4. pass complete merged-main engineering gate;
5. recheck `main` did not move during verification.

Only after those five steps may the combined owner test run. A combined PASS will close both outstanding visible acceptance boundaries and unlock M1.10.

## Permanent procedure

Root-cause fixes only. Never weaken an accepted test or historical constraint to fit new code. Keep one active brick. Use exact-head CI, expected-head merge locks and merged-main verification. Owner/browser PASS must always be tied to an exact release.
