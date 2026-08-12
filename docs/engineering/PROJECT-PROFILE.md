# HSE Verify — Project Profile

## Identity and authority

- **Project:** HSE Verify, a multi-role workforce trust platform.
- **Build model:** Phase 1 clean rebuild; Version 10/prototype code is capability reference only.
- **Frozen authority:** HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026.
- **Repository:** `itxsam57/hseverify`; default branch `main`.
- **Current build position:** `docs/NEXT_BUILD_UNIT.md` + `docs/bookmarks/MILESTONE_PATH.md`.
- **Formal progress:** **7/12 Milestone 1 bricks DONE**.
- **M1.07 Worker Onboarding and Identity Engine:** **DONE — OWNER PASS — 11 August 2026**.
- **M1.08 Company Registration and Verification:** **ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED** to the combined Milestone 1 browser test.
- **M1.09 Sites, Departments and Company Team:** **ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**; PR #75, exact head `32130f82b661b86d7ad08f5dad7a368346cfe13d`, gate `31569523799`, merge `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`, merged-main gate `31569898065`.
- **M1.10 Worker Invitations and Company Codes:** **IN PROGRESS**; only active product brick.
- **M1.11+:** blocked.

## Accepted architecture

- Next.js App Router + React + TypeScript.
- Direct SQL repository layer; PGlite local/CI and PostgreSQL production target; no ORM.
- Fixed-role authentication with password/OTP/TOTP, opaque revocable sessions, recovery and invitation-only staff onboarding.
- Company authority always derives from the current server-resolved tenant membership and explicit permission ceiling/overrides.
- Worker identity is portable and is never owned by a Company tenant.
- Private files use server-owned storage, quarantine, scan and signed access from M1.06.
- Material security/business state uses immutable audit and durable transactional patterns established in M1.05.
- Local/sandbox provider adapters are testing infrastructure, not live production providers.

## Current M1.10 architecture

M1.10 must extend, rather than duplicate, accepted primitives:
- Company Worker authority uses `company.workforce.manage`/`company.workforce.read` and server-resolved tenant scope.
- Worker invitations and Company registration codes use hashed, expiring, revocable secrets with concurrency-safe redemption.
- Site/Department defaults reuse M1.09 durable active tenant-owned units.
- Company↔Worker linking is a business relationship, not a Company staff membership and not a replacement Worker identity.
- New Worker redemption reuses M1.03 mandatory Worker email+phone verification before Company link activation.
- Existing Worker redemption binds the authenticated Worker account.
- Bulk import must validate rows, expose row-level errors and be idempotent/duplicate-safe.
- Assessment pre-assignment in M1.10 is metadata/default capture only; M2 assessment behavior remains blocked.

## Release discipline

Root-cause fixes, permanent regressions, exact-head full gate, expected-head merge lock and merged-main full gate. Per the latest owner instruction, M1.10–M1.12 advance on engineering release without intermediate browser stops; M1.08–M1.12 visible acceptance is performed once in the combined Milestone 1 browser test.