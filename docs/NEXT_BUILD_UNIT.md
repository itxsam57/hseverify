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

Subunit 4 must add the secure capability for an already safe/`available` private file to be previewed or downloaded by an authorized principal without exposing a public object URL or allowing browser-controlled storage/content authority. It must not pull Worker identity/evidence workflow, reviewer queue workflow, public verification or M1.07+ product behavior forward.

## Required Subunit 4 boundary

1. Only a secure file already in the accepted `available` state may receive preview/download authorization. `reserved`, `quarantined`, `scan_pending`, `unsafe` and `scan_failed` files must fail closed.
2. Authorization must be server-derived from the live authenticated principal and current role/scope. A browser must never choose account ownership, role, Company tenant, membership, object key, storage adapter, MIME, hash or safety state.
3. Company access must revalidate the exact active tenant and membership; copied cross-account, cross-role and cross-tenant file IDs must remain non-enumerating and denied.
4. Preview/download authorization must be short-lived and bind the exact file, authorized principal/scope and explicit purpose. It must not function as a bearer URL that silently widens access beyond its intended scope.
5. Signed authorization must use a server-held signing secret/key and a bounded versioned payload. Browser input must not select signing algorithms, secrets, storage paths or arbitrary redirect/download URLs.
6. Expired, malformed, tampered, wrong-purpose, wrong-file, wrong-role, wrong-account, wrong-tenant, wrong-membership and revoked-session authorization must fail closed.
7. Authorization verification must re-check current file lifecycle and live session/scope at use time. A previously issued capability must not bypass a later revoked session, suspended Company membership or file safety/state change.
8. Exact file content must be loaded only through the accepted private object-storage adapter and the server-bound object key. No public bucket/object URL may be returned to the browser.
9. The response content type must come from accepted stored file provenance, not browser query/header input. PDF and image responses must use safe content headers and bounded filename handling.
10. Preview and download purposes must remain distinguishable so a preview-only capability cannot silently become a download capability if the architecture treats them differently.
11. Token/signature reuse, expiry and concurrent verification must be deterministic and safe. Reuse within the allowed contract must not mutate file ownership/history or mint broader authority.
12. If a signed-capability record/store is required, it must preserve the existing data-boundary rules and use server-owned opaque IDs. Do not create a second authentication/session system.
13. Material authorization denials or security-relevant use events must use the accepted immutable audit authority where required by the platform audit policy; do not create a preview-specific event store.
14. Signed preview/download failures must not reveal whether another account/tenant's file exists.
15. No file bytes, object path, signed secret, raw storage credential or sensitive token may be written to audit/log metadata.
16. Add permanent regressions for unavailable/unsafe file denial, copied IDs, cross-role/cross-tenant access, token expiry, token tamper, wrong purpose, wrong file, revoked session, suspended membership, safe content headers, path/filename injection and no public object URL leakage.
17. Preserve M1.01–M1.06 Subunit 3 accepted behavior and wire every new check into the complete repository engineering gate.
18. Introduce browser-visible behavior only if the canonical secure preview capability genuinely requires it. Reviewer-facing evidence workflow remains M1.07/M2.02 and must not be invented here.

## Explicitly blocked during Subunit 4

- Worker identity submission, liveness and Worker ID issuance from M1.07.
- Reviewer evidence queue/task workflow from later verification units.
- Company verification from M1.08.
- Sites/departments/team from M1.09.
- Worker invitations/codes from M1.10.
- Qualification, experience, employment, skill and leaving-letter product workflows from M1.11.
- Public verification from M1.12.
- Assessment, review, interview, credential, billing and later milestone features.
- Public object URLs or public bucket exposure.
- Browser-selected storage paths, MIME/content type, signing algorithm, provider or authorization scope.
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
