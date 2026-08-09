# Implementation Status

## Formal Milestone 1 bricks

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **IN PROGRESS**.
  - Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS — 9 August 2026**.
  - Subunit 2 Isolated Upload Intake, Validation and Quarantine — **READY TO BUILD**.
  - Subunit 3 Durable Malware Scan Job and Local/Test Scanner Adapter — **BLOCKED**.
  - Subunit 4 Authorized Signed Preview/Download Pipeline — **BLOCKED**.
  - Subunit 5 Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED**.
- M1.07 through M1.12 — blocked/incomplete according to `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

**Phase 1 progress: 5 of 12 Milestone 1 bricks are DONE.**

## Accepted platform boundary through M1.06 Subunit 1

- Next.js application, local/test PGlite database, deterministic migrations and fail-closed CI gate.
- Shared responsive design system and six fixed role-specific portal shells.
- Worker registration with mandatory email and phone OTP through the local/test delivery sandbox.
- Fixed-role password sessions, mandatory staff TOTP, recovery and owned-session management.
- Explicit permission matrices, trusted Company tenant context and direct tenant predicates in SQL.
- Transactional authority revalidation and non-enumerating cross-role/cross-tenant denial.
- Immutable shared platform audit events with database-enforced append-only storage and authorized bounded reads.
- Transactional outbox with deterministic claim/lease/reclaim, bounded retry/backoff, terminal failure, idempotency and durable attempt history.
- Persisted notifications with exact recipient/role/Company scope, durable one-way read state and role-safe reauthorized deep links.
- Durable email-delivery state with immutable attempt history, provider-neutral results, lease-safe worker integration and deterministic `local_test` adapter.
- One canonical `platform_secure_files` metadata authority with opaque server IDs/object keys, exact principal/tenant scope, immutable provenance and deterministic reservation idempotency.
- Relational secure-file metadata contains no file bytes/base64 object payloads.
- One server-only local/test private-object adapter rooted at `.data/private-objects`; application callers cannot choose arbitrary roots, object keys, public URLs or network providers.
- Local storage rejects traversal, overwrite conflicts and symbolic-link path/object escapes before outside write side effects.
- Secure-file migration `0011` has deterministic owned-layer rollback/reapply and persistent restart/checksum proof.
- Permanent secure-file regressions `REG-036` through `REG-038` are protected.

## M1.06 Subunit 1 final evidence

- Implementation PR: `#47`
- Hardened implementation head: `80755684278365daabfc572990ddcf992e722434`
- Hardened gate: `31326798669 / 93278355271` — **PASS**
- Exact final PR head: `aefc1283922e40d2f6e3bc375e45a8c5ce1693eb`
- Final PR gate: `31327013176 / 93278912641` — **PASS**
- Implementation merge: `e2c2a748fd7d3b168517809f04f0d7d19c206f34`
- Merged-main gate: `31327264168 / 93279514688` — **PASS**
- Owner/browser test: **NOT REQUIRED — no visible workflow**
- Acceptance record: `docs/testing/results/M1_06_SECURE_FILE_FOUNDATION_FINAL_ACCEPTANCE.md`

No unresolved release-blocking Subunit 1 defect remains.

## Current permitted implementation

Only **M1.06 Subunit 2 — Isolated Upload Intake, Validation and Quarantine** is READY TO BUILD after this closure commit is merged and green on `main`.

The exact current gate is defined in `docs/NEXT_BUILD_UNIT.md`.

## Still incomplete

- Real validated upload intake and independent PDF/PNG/JPG/JPEG extension/MIME/signature/size checks.
- Quarantine finalization, upload replay/recovery and first material secure-file audit event.
- Durable malware scanning and deterministic local/test scanner adapter.
- Safe/available transition and authorized short-lived signed preview/download.
- Final combined M1.06 isolation/recovery/owner acceptance.
- M1.07 Worker identity/evidence, photograph/liveness, duplicate detection and permanent Worker ID issuance.
- M1.08 Company registration and verification.
- M1.09 sites, departments and company team management.
- M1.10 Worker invitations and company codes.
- M1.11 employment, experience, skill and leaving-letter records.
- M1.12 public verification foundation.
- Milestone 2 assessments/review/interviews and Milestone 3 credentials/billing/reporting/launch work.
- Production object-storage/malware-scanner credentials and other later provider activation.
