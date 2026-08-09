# Next Build Unit

## Accepted owner/engineering gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Subunit 1 Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 2 Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS — 9 August 2026**.
- M1.06 Subunit 3 Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE — ENGINEERING PASS — 10 August 2026**.

## Phase 1 progress

**5 of 12 Milestone 1 bricks are DONE.**

M1.06 remains **IN PROGRESS**. It is not a completed Milestone 1 brick until all five internal subunits and the brick-level acceptance gate close.

## M1.06 Subunit 2 final acceptance

Accepted evidence:

- Implementation PR: `#49`
- Accepted base main: `9fffd8e0bc479a19db6093052a219662c29ca7be`
- Frozen validated behavioral head: `f18ed46e994c26912f71ce5d621f15125c7191ab`
- Behavioral engineering gate: `31331804583 / 93291157241` — **PASS**
- Exact final PR head: `2c565d853719e4e53cad3a81ffb6caf9691a0292`
- Final PR gate: `31332058088 / 93291788050` — **PASS**
- Implementation merge: `7803dd66599edd88fc9b396447d235246badff90`
- Merged-main gate: `31332280267 / 93292321486` — **PASS**
- Owner/browser test: **NOT REQUIRED — no browser-visible workflow**
- Validation record: `docs/testing/results/M1_06_UPLOAD_QUARANTINE_VALIDATED.md`
- Final acceptance record: `docs/testing/results/M1_06_UPLOAD_QUARANTINE_FINAL_ACCEPTANCE.md`

The accepted Subunit 2 boundary includes trusted server upload policy, independent extension/declared-MIME/detected-structure/size controls, PDF/PNG/JPEG structural validation, server SHA-256 and size, exact private object-key binding, staged-byte retry recovery, stored-content revalidation, exact role/tenant isolation, concurrent upload-slot isolation and atomic `reserved -> quarantined` plus material audit persistence.

Permanent regressions `REG-039` through `REG-045` are protected. No unresolved release-blocking Subunit 2 defect remains.

## M1.06 Subunit 3 final acceptance

Accepted evidence:

- Implementation PR: `#51`
- Accepted base main: `f5d1efd8b0406b20ecb8ee3fa1ef0ff2224144e3`
- Frozen validated behavioral head: `c90bffd91abbdd393df605629d4adf7f4a18ca70`
- Behavioral engineering gate: `31336370195 / 93302810391` — **PASS**
- Exact final PR head: `2740f43530954a73d216a4113eeff891adb15da4`
- Final PR gate: `31336669361 / 93303550928` — **PASS**
- Final PR evidence artifact: `9044579615`
- Final PR artifact digest: `sha256:1c2f58bb2068f2fd366b12485213617ba39e14a4f2813062fe874723885f7dff`
- Implementation merge: `02339679f3ab7351157ed3cf5f46e079f6a1621e`
- Merged-main gate: `31336939705 / 93304245473` — **PASS**
- Owner/browser test: **NOT REQUIRED — no browser-visible workflow**
- Validation record: `docs/testing/results/M1_06_MALWARE_SCAN_VALIDATED.md`
- Final acceptance record: `docs/testing/results/M1_06_MALWARE_SCAN_FINAL_ACCEPTANCE.md`

The accepted Subunit 3 boundary includes one fixed `secure_file.scan` outbox job, exact scan-generation/job binding, live account/role/Company tenant revalidation, static shared-worker handler registration, trusted lease capability, consistent outbox-before-file lock order, private-object byte-size/SHA-256 revalidation, deterministic local/test clean/EICAR/retry/terminal scanner fixtures, bounded result vocabulary, repository and database result semantics, retry/terminal recovery, stale lease protection, idempotent replay and durable audit/job/file history.

Permanent regressions `REG-046` through `REG-054` are protected. No unresolved release-blocking Subunit 3 defect remains.

## Current build gate

# M1.06 — SECURE STORAGE AND UPLOAD PIPELINE — IN PROGRESS

M1.06 remains the only permitted Milestone 1 brick. M1.07 and later bricks remain blocked until M1.06 is formally accepted.

Canonical completion requirement: **PDF/image upload isolation, MIME/size checks, quarantine, scan adapter and signed preview.**

## M1.06 internal progress

1. Secure File Domain, Metadata Schema and Private Object Storage Adapter — **DONE — ENGINEERING PASS**.
2. Isolated Upload Intake, Validation and Quarantine — **DONE — ENGINEERING PASS**.
3. Durable Malware Scan Job and Local/Test Scanner Adapter — **DONE — ENGINEERING PASS**.
4. **Authorized Signed Preview/Download Pipeline — READY TO BUILD.**
5. Complete M1.06 Isolation, Migration, Recovery and Owner Acceptance — **BLOCKED** until Subunit 4 closes.

## Current internal subunit

# Subunit 4 — Authorized Signed Preview/Download Pipeline

**Status: READY TO BUILD**

Subunit 4 uses only the already accepted canonical boundary below. Engineering decisions must implement these controls through the accepted authentication, authorization, private-storage and audit foundations without inventing a reviewer/evidence workflow or new product rules.

## Required Subunit 4 boundary

- Only safe/`available` files can receive preview/download authorization.
- Short-lived signed authorization binds the exact file, purpose and authorized principal/scope.
- Expired, tampered, wrong-role, wrong-account, wrong-tenant and revoked-session access fails closed and non-enumerating.
- Signed URL/token reuse and expiry have permanent regressions.
- PDF/image preview/download response uses safe content headers, no public object URL and no browser-selected content type/path.
- Reviewer-facing identity/evidence workflow remains M1.07/M2.02; M1.06 supplies the secure file preview capability only.

## Explicitly blocked during Subunit 4

- Worker identity submission/liveness/Worker ID issuance and reviewer-facing evidence workflow.
- Company verification, sites/departments/team, worker invitations/codes, employment/evidence product workflows and public verification from M1.07–M1.12.
- Assessment, review, interview, credential, billing and later milestone features.
- Public bucket/object URLs or browser-selected storage path/content type/authorization scope.
- Live production malware-scanner credentials/service; Subunit 3 accepted only the local/test scanner foundation.

## Planned later M1.06 boundary

### Subunit 5 — Complete M1.06 Acceptance

- Combined upload/storage/scan/preview isolation and recovery suite.
- Persistent metadata/object consistency and migration proof.
- Malicious upload, path traversal, content mismatch, copied-ID and signed-link abuse regressions.
- Exact owner handoff only for genuinely visible/local-test behavior.
- M1.06 becomes DONE only after exact-head PR gate, merge, merged-main gate, owner PASS where meaningful and separate closure record.

## M1.06 inherited non-negotiable controls

- Large uploads belong in private object storage, never relational rows.
- Application/browser input never supplies decisive authorization, tenant, storage key, provider or executable handler authority.
- Server-side authorization and direct tenant predicates remain mandatory.
- No public bucket/object URLs.
- No preview/download before required safety state allows it.
- MIME, extension, size and malware state are independent checks; none substitutes for another.
- Never weaken M1.03 portal isolation, M1.04 tenant isolation or M1.05 audit/outbox/notification/email foundations.
- Slow/retryable scan work uses the accepted durable background worker and bounded retry rules.
- Every discovered defect becomes a permanent regression before the subunit can close.

## Gate rule

M1.06 work proceeds one subunit at a time. Subunit 4 is complete only after its exact implementation head passes the complete engineering gate, merges without drift, merged `main` passes again, and any genuinely visible owner behavior is accepted. Until then Subunit 5 and M1.07+ remain blocked.
