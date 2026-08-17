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
- **M1.10 Worker Invitations and Company Codes:** **ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO M1.13**; PR #76, exact head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`, targeted gate `31971156192`, full gate `31971157867`, merge `3b32287fecb30f16d682cb130be0e8f1eb466616`, merged-main gate `31971506738`.
- **M1.11 Employment, Experience, Qualification, Skill and Leaving Records:** **IN PROGRESS**; only active product brick.
- **M1.12+:** blocked.

## Accepted architecture

- Next.js App Router + React + TypeScript.
- Direct SQL repository layer; PGlite local/CI and PostgreSQL production target; no ORM.
- Fixed-role authentication with password/OTP/TOTP, opaque revocable sessions, recovery and invitation-only staff onboarding.
- Company authority always derives from the current server-resolved tenant membership and explicit permission ceiling/overrides.
- Worker identity is portable and is never owned by a Company tenant.
- Private files use server-owned storage, quarantine, scan and signed access from M1.06.
- Material security/business state uses immutable audit and durable transactional patterns established in M1.05.
- Local/sandbox provider adapters are testing infrastructure, not live production providers.

## Current M1.11 architecture

M1.11 extends accepted primitives rather than creating parallel systems:
- Worker ownership derives only from the live authenticated Worker principal; browser-supplied owner/account authority is never trusted.
- Qualifications, experience, employment and skills use typed relational records with immutable submitted versions and explicit revisions/history.
- Qualification metadata and its primary certificate remain one integrated record/version; submission requires the exact active primary certificate.
- Evidence files reuse the M1.06 private reservation/quarantine/scan pipeline and bind to the exact record, version and attachment slot.
- Employment end-state and skill inactivation preserve history and are terminal at the transaction boundary; crafted repeat/reopen requests fail closed.
- Leaving letters bind only to the exact ended employment/version and preserve replacement lineage.
- Skill assurance states remain distinct; Worker writes cannot self-promote beyond `self_declared`.
- Material record/file/version transitions append centralized immutable audit with the true Worker actor inside the same transaction.
- Reviewer verification remains M2.02, public verification remains M1.12, and assessment behavior remains blocked for M2.

## Release discipline

Root-cause fixes, permanent regressions, exact-head full gate, expected-head merge lock and merged-main full gate. Per the latest owner instruction, M1.11–M1.12 advance on engineering release without intermediate browser stops; M1.08–M1.12 visible acceptance is performed once in the combined Milestone 1 browser test.