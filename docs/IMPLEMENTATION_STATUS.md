# Implementation Status

## Formal Milestone 1 bricks

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.
- M1.07 Worker Onboarding and Identity Engine — **IN PROGRESS**.
  - Subunit 1 Identity Domain, Versioned Persistence and State Machine — **DONE — ENGINEERING PASS**.
  - Subunit 2 Worker Identity Draft and Verified Contact Binding — **DONE — ENGINEERING PASS**.
  - Subunit 3 Secure Identity Document, Profile Photo and Selfie Evidence Binding — **DONE — ENGINEERING PASS**.
  - Subunit 4 Automated Identity Checks and Provider Adapter Boundary — **IN PROGRESS**.
  - Subunit 5 Duplicate Signals, Recovery and Worker-ID Eligibility — **BLOCKED by S4**.
  - Subunit 6 Correction Versions, Worker Identity UX and Cumulative Acceptance — **BLOCKED by S5**.
- M1.08 Company Registration and Verification — **BLOCKED by complete M1.07 acceptance**.
- M1.09 through M1.12 — **BLOCKED in canonical order**.

**Milestone 1 progress: 6 of 12 bricks are DONE.**

## Accepted platform boundary

The clean rebuild has accepted:

- deterministic repository/environment/CI and PGlite migration foundations;
- shared accessible/responsive UX and fixed role-specific portal shells;
- Worker registration with mandatory email/phone OTP, fixed-role sessions, staff TOTP, password recovery and owned-session management;
- explicit authorization matrices, server-derived Company tenant context, SQL tenant scope and stale-authority revalidation;
- immutable platform audit, durable shared outbox/background work, persisted role-safe notifications and provider-neutral email delivery;
- M1.06 private secure-file metadata/object storage, bounded upload validation, quarantine, durable malware scanning, signed preview/download, live reauthorization, restart/migration proof and no public object authority;
- M1.07 S1 separate versioned Worker identity aggregate and canonical lifecycle;
- M1.07 S2 Worker-owned draft personal facts with verified email/phone snapshots sourced from authentication authority;
- M1.07 S3 exact same-Worker binding to accepted `available` M1.06 identity document/profile-photo/selfie evidence, immutable supersession history and post-submission evidence freeze.

## Current accepted main beneath S4

`7f5eb690c185a04e4b1e9471d7993c2cf1a83424`

This includes the REG-076 Windows migration checksum portability repair from PR `#64`; merged-main engineering gate `31399358346` — **PASS**.

The cumulative visible browser baseline through this accepted main has been owner-tested and reported **PASS — 10 August 2026**. S4 and S5 are internal identity infrastructure and do not require repetition of that baseline unless they actually introduce a visible change. S6 is the next mandatory targeted owner/browser boundary.

## Active permitted implementation

Only **M1.07 Subunit 4 — Automated Identity Checks and Provider Adapter Boundary** is active.

Implementation PR: `#63`.

Latest validated behavioral head:

`52c40c1bfab3e1a6b0c80363ef9838cc96cc45a6`

Full engineering gate `31409182878` — **PASS**.

A final exact-head pass is still required after current-state documentation is synchronized; S4 is not accepted or DONE until its implementation PR is merged at the exact verified head, merged `main` passes, and a separate closure record/closure PR passes and merges.

### S4 implemented behavior awaiting formal acceptance

- shared M1.05 outbox job `worker_identity.automated_checks`; no duplicate queue;
- Worker can schedule only the Worker's own exact current submitted identity version;
- Worker code cannot self-transition into automated checks;
- trusted live outbox lease is the authority for `submitted -> automated_checks` and completion to `manual_review`;
- durable exact-version check runs/results for document consistency, face comparison and liveness;
- deterministic development/test adapter exercises the provider contract without claiming real biometric/document verification;
- preview/production provider-dependent checks fail closed while no approved provider is configured;
- provider unavailability leaves identity in `automated_checks` and records durable diagnosis rather than fabricating a result;
- stale/withdrawn jobs drain safely without advancing the identity;
- result/audit/outbox summaries remain bounded and exclude raw identity facts/evidence bytes/object keys/hashes/tokens/credentials;
- widened historical `0013_secure_file_malware_scan` outbox vocabulary has exact checksum repair lineage and cross-platform CRLF/LF normalization proof;
- S1-S3 and all accepted M1.01-M1.06 regression suites remain in the complete gate;
- no browser-visible S4 route/UI and no M2.02 reviewer queue is introduced.

## Still incomplete in M1.07

- formal S4 implementation merge and closure evidence;
- S5 conservative duplicate-signal domain, recovery/disposition controls and permanent Worker-ID eligibility/issuance;
- S6 correction-version workflow and complete real `/worker/identity` Worker UX;
- S6 targeted owner/browser acceptance and complete M1.07 closure.

## Later blocked work

- M1.08 Company registration and verification;
- M1.09 sites, departments and company team management;
- M1.10 Worker invitations and Company codes;
- M1.11 employment, experience, qualification, skill and leaving-letter records;
- M1.12 public verification foundation;
- Milestone 2 assessment/review/interview/decision workflows;
- Milestone 3 credentials, living records, sharing, billing, reporting, appeals, privacy/accessibility operations, production integrations, load/security/recovery certification and launch handover;
- production activation for external SMS/private-object-storage/malware/liveness/face/video/payment providers.

The exact live implementation gate remains `docs/NEXT_BUILD_UNIT.md`; permanent build order remains `docs/bookmarks/MILESTONE_PATH.md`.
