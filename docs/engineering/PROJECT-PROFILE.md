# HSE Verify — Project Profile

## Identity and authority

- **Project:** HSE Verify, a multi-role workforce trust platform.
- **Build model:** Phase 1 clean rebuild; Version 10/prototype code is capability reference only.
- **Frozen authority:** HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026.
- **Repository:** `itxsam57/hseverify`; default branch `main`.
- **Current build position:** `docs/NEXT_BUILD_UNIT.md` + `docs/bookmarks/MILESTONE_PATH.md`.
- **Formal progress:** **7/12 Milestone 1 bricks DONE**.
- **M1.08:** implementation merged, engineering PASS, owner acceptance deferred to combined M1.08 + M1.09 browser test.
- **M1.09:** **IN PROGRESS — PR #75**; only active product brick.
- **M1.10+:** blocked.

## Accepted architecture

- Next.js App Router + React + TypeScript.
- Direct SQL repository layer; PGlite local/CI and PostgreSQL production target; no ORM.
- Fixed-role authentication with password/OTP/TOTP, opaque revocable sessions, recovery and invitation-only staff onboarding.
- Company authority always derives from the current server-resolved tenant membership and explicit permission ceiling/overrides.
- Private files use server-owned storage, quarantine, scan and signed access from M1.06.
- Material security/business state uses immutable audit and durable transactional patterns established in M1.05.
- Local/sandbox provider adapters are testing infrastructure, not live production providers.

## Current M1.09 architecture

M1.09 extends, rather than duplicates, accepted primitives:
- Sites and Departments are durable tenant-owned records in a combined Company interface.
- Archive ends active assignments while preserving historical rows; restore never silently recreates assignments.
- Company Team is separate from Workers.
- Company Team invitation reuses `auth_staff_invitations` and `/staff/invite/<token>` password/TOTP enrollment.
- Role/site/department/permission scope is server/database validated.
- No Company user can grant a permission they do not currently possess.

## Release discipline

Root-cause fixes, permanent regressions, exact-head full gate, expected-head merge lock, merged-main full gate, then owner/browser acceptance for genuinely visible behavior. M1.08 + M1.09 owner acceptance will be tested together per owner instruction.
