# Implementation Status

## Formal Milestone 1 bricks

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **IN PROGRESS**.
  - Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS — 9 August 2026**.
  - Subunit 2 Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS — 9 August 2026**.
  - Subunit 3 Durable Malware Scan Job and Local/Test Scanner Adapter — **READY TO BUILD**.
  - Subunit 4 Authorized Signed Preview/Download Pipeline — **BLOCKED**.
  - Subunit 5 Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED**.
- M1.07 through M1.12 — blocked/incomplete according to `docs/NEXT_BUILD_UNIT.md` and `docs/bookmarks/MILESTONE_PATH.md`.

**Phase 1 progress: 5 of 12 Milestone 1 bricks are DONE.**

## Accepted platform boundary through M1.06 Subunit 2

- Next.js application, local/test PGlite database, deterministic migrations and fail-closed CI gate.
- Shared responsive design system and six fixed role-specific portal shells.
- Worker registration with mandatory email and phone OTP through the local/test delivery sandbox.
- Fixed-role password sessions, mandatory staff TOTP, recovery and owned-session management.
- Explicit permission matrices, trusted Company tenant context and direct tenant predicates in SQL.
- Immutable platform audit, transactional outbox, persisted notifications and durable provider-neutral email delivery foundations from M1.05.
- Canonical `platform_secure_files` metadata authority with opaque server IDs/object keys, exact principal/tenant scope, immutable provenance and deterministic reservation idempotency.
- File bytes remain outside relational storage in one server-owned private-object adapter; no public URLs or browser-chosen roots/keys.
- Local/test private storage rejects traversal, overwrite conflicts and symlink escapes.
- Server-only upload validation accepts only policy-permitted PDF/PNG/JPG/JPEG and independently checks extension, declared MIME, detected structure and size.
- PDF final EOF, PNG signature/chunk CRC/IHDR/IDAT/IEND and JPEG marker/frame/scan/EOI structure have permanent regressions.
- Untrusted bytes are copied before validation authority; byte size and SHA-256 are server-derived.
- Accepted bytes write only to the reservation's server-derived object key; same-content staging retry is idempotent and conflicting replacement fails closed.
- Stored object hash/size is revalidated before metadata finalization.
- Exact live account/role/Company scope is revalidated transactionally before quarantine finalization.
- `reserved -> quarantined` and the material `secure_file.quarantined` audit fact commit atomically; forced audit failure rolls the file transition back completely.
- Same-content repository replay is idempotent without duplicate audit facts; conflicting replay cannot replace accepted provenance.
- Independent upload slots remain isolated under concurrent finalization.
- Migrations `0011` and `0012` have rollback/reapply/checksum and persistent restart proof without invalidating immutable accepted history.
- Permanent secure-file/upload regressions `REG-036` through `REG-045` are protected.

## M1.06 Subunit 2 final evidence

- Implementation PR: `#49`
- Accepted base: `9fffd8e0bc479a19db6093052a219662c29ca7be`
- Frozen validated behavioral head: `f18ed46e994c26912f71ce5d621f15125c7191ab`
- Behavioral gate: `31331804583 / 93291157241` — **PASS**
- Exact final PR head: `2c565d853719e4e53cad3a81ffb6caf9691a0292`
- Final PR gate: `31332058088 / 93291788050` — **PASS**
- Implementation merge: `7803dd66599edd88fc9b396447d235246badff90`
- Merged-main gate: `31332280267 / 93292321486` — **PASS**
- Owner/browser test: **NOT REQUIRED — no visible workflow**
- Final acceptance record: `docs/testing/results/M1_06_UPLOAD_QUARANTINE_FINAL_ACCEPTANCE.md`

No unresolved release-blocking Subunit 2 defect remains.

## Current permitted implementation

Only **M1.06 Subunit 3 — Durable Malware Scan Job and Local/Test Scanner Adapter** is READY TO BUILD after this closure commit is merged and green on `main`.

The exact current gate is defined in `docs/NEXT_BUILD_UNIT.md`.

## Still incomplete

- Durable malware-scan job scheduling through the accepted outbox/background worker.
- Provider-neutral scanner result contract and deterministic local/test scanner adapter.
- Exact private-object provenance revalidation before scanning.
- Durable clean/unsafe/scan-failed transitions with retry/reclaim/terminal-failure integrity.
- Authorized short-lived signed preview/download from Subunit 4.
- Final combined M1.06 isolation/recovery/owner acceptance from Subunit 5.
- M1.07 Worker identity/evidence, photograph/liveness, duplicate detection and permanent Worker ID issuance.
- M1.08 Company registration and verification.
- M1.09 sites, departments and company team management.
- M1.10 Worker invitations and company codes.
- M1.11 employment, experience, skill and leaving-letter records.
- M1.12 public verification foundation.
- Milestone 2 assessments/review/interviews and Milestone 3 credentials/billing/reporting/launch work.
- Production object-storage/malware-scanner credentials and other later provider activation.
