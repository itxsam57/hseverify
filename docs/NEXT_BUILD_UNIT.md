# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen product scope remains the **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records accepted brick history and build order. Earlier Version 10/prototype code is capability reference only and is not an architectural dependency.

## Accepted owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**; accepted slice only, M1.07 remains incomplete.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 2 Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 3 Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE — ENGINEERING PASS — 10 August 2026**.

## Phase 1 / Milestone 1 progress

**5 of 12 Milestone 1 bricks are DONE.**

M1.06 remains **IN PROGRESS**. It is not a completed Milestone 1 brick until all five internal subunits and the M1.06 brick-level acceptance gate close.

The last accepted canonical `main` boundary before Subunit 4 is:

`d4acee0093c2d1cd540fc944c1937183dd3afa8a`

## Current build gate

# M1.06 — SECURE STORAGE AND UPLOAD PIPELINE — IN PROGRESS

M1.06 is the only permitted Milestone 1 brick. M1.07 and later bricks remain blocked until M1.06 is formally accepted.

Canonical M1.06 completion requirement: **PDF/image upload isolation, MIME/size/signature checks, private quarantine, malware-scan adapter/lifecycle, and authorized signed preview/download.**

## M1.06 internal progress

1. Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS**.
2. Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS**.
3. Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE — ENGINEERING PASS**.
4. **Authorized Signed Preview/Download Pipeline — IN PROGRESS — PR #53.**
5. Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED** until Subunit 4 closes.

## Current internal subunit

# Subunit 4 — Authorized Signed Preview/Download Pipeline

**Status: IN PROGRESS — exact-head engineering gate required before merge.**

Subunit 4 must extend the accepted authentication, authorization, private-storage, audit and secure-file foundations. It must not invent the later Worker evidence/reviewer workflow.

### Required Subunit 4 boundary

- Only safe `available` files can receive preview/download authorization.
- Short-lived signed authorization binds the exact file, purpose and authorized principal/scope.
- Signed capability scope covers the current session, account, active role and, for Company users, the current tenant/membership.
- Expired, tampered, wrong-purpose, wrong-role, wrong-account, wrong-tenant, wrong-membership and revoked/stale-session access fails closed and non-enumerating.
- Token reuse while still valid and expiry behavior have permanent regression coverage.
- Use-time access repeats live authorization and owner/tenant repository scope before private-object access.
- Stored private content is revalidated against accepted size and SHA-256 before response.
- PDF/image preview/download responses use server-derived content type/path and safe headers.
- No public object URL, browser-selected object key, MIME, tenant, role, path or authorization scope is accepted.
- Production/preview fail closed until a real private object-storage provider is implemented; local/test uses only the accepted private adapter.
- Successful authorization and successful serving create immutable audit facts without storing signed tokens, URLs, storage authority, hashes, secrets or raw file bytes.
- Reviewer-facing identity/evidence workflow remains M1.07/M2.02; M1.06 supplies only the secure file capability.

### Explicitly blocked during Subunit 4

- Worker identity submission, liveness, permanent Worker ID issuance or reviewer-facing evidence workflow.
- Company verification, sites/departments/team, Worker invitations/codes, employment/evidence product records and public verification from M1.07–M1.12.
- Assessments, Question Bank, review, interview, credentials, billing and later milestone features.
- Public bucket/object URLs or browser-selected storage/content/tenant/role authority.
- Live production malware-scanner credentials/service; accepted Subunit 3 contains only the provider-neutral/local-test scanner foundation.

## Subunit 4 acceptance gate

Subunit 4 is not DONE merely because code exists. It closes only after:

1. every discovered serious defect has a stable regression ID and permanent automated guard;
2. focused signed-access checks pass;
3. the complete repository engineering gate passes on the exact implementation head;
4. no required check is skipped, weakened or hidden;
5. the implementation merges without drift;
6. merged `main` passes the complete engineering gate again;
7. any genuinely browser-visible owner behavior receives the exact owner handoff and PASS where applicable;
8. the closure record is committed separately.

Until then Subunit 5 and M1.07+ remain blocked.

## Planned Subunit 5 — Complete M1.06 Acceptance

After Subunit 4 closes, Subunit 5 must prove the entire M1.06 pipeline together:

- upload/storage/quarantine/scan/preview isolation and recovery;
- persistent metadata/object consistency and restart behavior;
- migration application, rollback boundary and reapplication;
- malicious upload, path traversal, content mismatch, copied-ID, cross-account, cross-tenant and signed-link abuse regressions;
- retry/interruption and stale-authority behavior;
- exact owner handoff only for genuinely visible/local-test behavior;
- exact-head gate → merge → merged-main gate → owner PASS where meaningful → separate closure record.

M1.06 becomes DONE only after Subunit 5 and the brick-level acceptance gate close.

## Inherited non-negotiable controls

- Large uploads belong in private object storage, never relational rows.
- Browser/application input never supplies decisive authorization, tenant, storage key, provider or executable handler authority.
- Server-side authorization and direct owner/tenant predicates remain mandatory.
- No public bucket/object URLs.
- No preview/download before the required safety state allows it.
- MIME, extension, size, signature and malware state are independent checks; none substitutes for another.
- Slow/retryable scan work uses the accepted M1.05 durable outbox/background worker and bounded retry rules.
- M1.03 portal isolation, M1.04 tenant isolation and M1.05 audit/outbox/notification/email foundations may not be weakened.
- Every confirmed serious defect becomes a permanent regression before the current subunit can close.
- The next brick never begins while the current brick is incomplete.
