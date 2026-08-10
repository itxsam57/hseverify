# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen product scope remains the **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records accepted brick history and build order. Earlier Version 10/prototype code is capability reference only and is not an architectural dependency.

## Accepted brick gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**; accepted slice only, not complete M1.07.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.

## M1.07 accepted subunits

### Subunit 1 — Identity Domain, Versioned Persistence and State Machine

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#57`, exact head `f7ca497d5becdf7f0a828943c833a8e8915278b6`, gate `31374028751` — **PASS**;
- merge `19a5ccc877834e78a6568a75099484aebdec0d1c`, merged-main gate `31374492294` — **PASS**;
- closure PR `#58`, exact head `b1ee6887775371874c743ef4c9fea2461b869799`, gate `31375874361` — **PASS**;
- closure merge `056a33578a70bc5e6412c861ce28fbd2ae76d40f`, merged-main gate `31376271877` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no visible surface;
- permanent regressions include REG-073 and REG-074.

### Subunit 2 — Worker Identity Draft and Verified Contact Binding

**DONE — ENGINEERING PASS — 10 August 2026.**

- implementation PR `#59`, exact head `29350dd47b51471462e21cdebbe6f5b67ebc2c18`, gate `31378294472` — **PASS**;
- implementation merge `61bdbde805ac4e27ade7a9c787559ff87b2dfb9d`, merged-main gate `31378748392` — **PASS**;
- closure PR `#60`, exact head `7e922f2d1290dea1ec1b62180a149a9d2754d843`, gate `31379682719` — **PASS**;
- closure merge `3ebc4a400625d52ba0cfb20c069633113d2f7dc3`, merged-main gate `31380077359` — **PASS**;
- browser/owner test — **NOT REQUIRED**; no visible route/UI;
- verified contact authority is server-derived from the live Worker authentication account and independently revalidated by SQL;
- partial personal facts are version-owned, draft-revision protected and submission-gated;
- S1 and S2 layer tests are migration-ceiling isolated while the complete application gate still applies the entire current migration stack.

## Milestone 1 progress

**6 of 12 Milestone 1 bricks are DONE.**

M1.07 remains the only active brick. M1.08 and later bricks remain blocked until complete M1.07 acceptance.

Current accepted canonical `main` before Subunit 3:

`3ebc4a400625d52ba0cfb20c069633113d2f7dc3`

## Current build gate

# M1.07 — WORKER ONBOARDING AND IDENTITY ENGINE — IN PROGRESS

Identity remains a separate, versioned, server-authoritative domain. The accepted Worker Profile slice is a reusable prerequisite only and is not the Identity Engine.

### Canonical M1.07 outcome

A Worker can build and submit a versioned identity record using verified contact authority and secure M1.06 evidence; the system can run deterministic automated checks, surface duplicate signals without auto-merging, preserve corrections/version history, and issue a permanent Worker ID only after the required identity and duplicate gates are satisfied. Reviewer-facing verification queues remain M2.02.

## M1.07 internal subunits

1. **Identity Domain, Versioned Persistence and State Machine — DONE.**
   - separate identity aggregate/version history;
   - server-authoritative lifecycle, immutable submitted versions and correction-lineage constraints;
   - Worker self ownership and live role-bound session revalidation;
   - optimistic lifecycle locking, atomic bounded audit facts, monotonic migration/restart proof.

2. **Worker Identity Draft and Verified Contact Binding — DONE.**
   - version-owned legal/previous name, DOB, nationality and residence draft facts;
   - verified email/phone + timestamps derived only from live authentication authority;
   - SQL overwrites/revalidates contact snapshots and blocks forged/unverified contacts;
   - independent optimistic `draft_revision`;
   - incomplete draft persistence with complete-facts/contact submission gate;
   - ordinary draft saves are not immutable security-audit spam;
   - S2 tests stop at migration `0016_worker_identity_draft_details`; release/full-stack tests do not.

3. **Secure Identity Document, Profile Photo and Selfie Evidence Binding — IN PROGRESS.**
   - reuse the accepted M1.06 secure-file reservation/upload/quarantine/scan/access domain; do not create a second storage path;
   - evidence purposes are `identity_document`, `profile_photo` and `selfie`;
   - document types are passport, national ID and residence permit with normalized document number and optional issue/expiry dates;
   - bind only an M1.06 `available` secure file owned by the exact Worker, with Worker role and no tenant/membership scope;
   - profile-photo and selfie evidence must be a detected PNG/JPEG image; PDF is not accepted for those purposes;
   - the service reuses M1.06 scoped file lookup, the evidence repository revalidates inside its transaction, and SQL independently revalidates again at insert time;
   - relational identity evidence stores only opaque `secure_file_id` references and identity metadata — never raw bytes, base64, object key, content hash, reservation key, storage adapter or access token;
   - there is deliberately no physical foreign key from durable identity evidence history to `platform_secure_files`; M1.06 keeps its accepted independent local/test rollback boundary while binding-time authority remains live and server-side;
   - exactly one active binding is allowed per identity version/purpose; replacement makes the previous binding `superseded` and preserves explicit lineage;
   - exact retries are idempotent, while materially different replacements must present the active binding ID they were based on so stale writes fail rather than silently win;
   - binding and superseding are allowed only on the current editable `draft`/`correction_pending` version; submitted evidence is frozen and non-deletable;
   - S3 submission readiness requires one current available identity document, profile photo and selfie in addition to S2 personal/contact readiness;
   - S3 migrations are monotonic: rollback/reapply never deletes durable identity evidence history;
   - no browser-visible route/UI is introduced in S3, so owner browser testing is not a S3 gate.

4. **Automated Identity Checks and Provider Adapter Boundary — BLOCKED by Subunit 3.**
   - deterministic local/test checks;
   - liveness/face/document-provider interfaces behind approved adapters;
   - preview/production provider-dependent checks fail closed until configured;
   - provider/AI output is assistive evidence, never final authority.

5. **Duplicate Signals, Recovery and Worker-ID Eligibility — BLOCKED by Subunit 4.**
   - compare verified email/phone, document identifiers, name/date-of-birth and lawful provider/fingerprint signals;
   - outcomes: continue, recover existing account, duplicate review, or temporarily block Worker-ID issuance;
   - **never auto-merge identities**;
   - permanent Worker ID is server-generated and issued only after all eligibility gates pass.

6. **Correction Versions, Worker Identity UX and Cumulative Acceptance — BLOCKED by Subunit 5.**
   - correction requests create new versions instead of overwriting accepted history;
   - real `/worker/identity` route and accessible/responsive state-aware UX;
   - loading/empty/validation/failure/permission-denial states and status timeline;
   - complete restart/concurrency/isolation/security/route regression coverage;
   - **genuine owner/browser live test is mandatory before M1.07 closes.**

## M1.07 state model to preserve

- `DRAFT -> SUBMITTED`;
- `SUBMITTED -> AUTOMATED_CHECKS` or `WITHDRAWN` only before review starts;
- `AUTOMATED_CHECKS -> MANUAL_REVIEW | MORE_INFO | REJECTED`;
- `MANUAL_REVIEW -> VERIFIED | MORE_INFO | REJECTED | ESCALATED`;
- `MORE_INFO -> MANUAL_REVIEW`;
- `VERIFIED -> CORRECTION_PENDING | EXPIRED_DOCUMENT | SUSPENDED`;
- `CORRECTION_PENDING -> VERIFIED` through a new accepted version or rejected correction;
- `SUSPENDED -> VERIFIED/REINSTATED | CLOSED` according to authorized recovery policy.

No outbound transition from `REJECTED`, `ESCALATED`, `EXPIRED_DOCUMENT`, `REINSTATED`, `CLOSED` or `WITHDRAWN` may be invented merely to satisfy implementation convenience. This brick may create backend state and Worker-facing projection, but it must not create M2.02 reviewer queues.

## M1.07 non-negotiable controls

1. Raw identity document/photo/selfie bytes remain private M1.06 objects; never JSON/base64/relational blobs/public URLs.
2. Identity/evidence ownership comes from the authenticated Worker principal; browser input never chooses account, role, tenant, object key/provider, reviewer or decision authority.
3. Submitted identity versions and evidence are immutable; corrections create explicit new version/evidence lineage.
4. Duplicate detection never silently merges identities.
5. Permanent Worker ID issuance is server-authoritative, unique, idempotent and gated.
6. Provider-dependent liveness/face/document verification is behind adapters; local/test deterministic, preview/production fail closed until configured.
7. AI/provider output cannot be the sole final verification/rejection/merge decision.
8. Material transitions, duplicate dispositions and Worker-ID issuance have bounded immutable audit evidence without raw document numbers, contact values, object keys, hashes, tokens or image bytes. Draft evidence changes are preserved in immutable/superseded evidence history rather than audit-spamming every edit.
9. M1.03 role isolation, M1.04 authorization, M1.05 audit/outbox and M1.06 private-file rules may not be weakened or duplicated.
10. Serious reproduced defects receive stable regression guards before closure.
11. Exact branch head must pass focused and complete fail-closed gates; merge only that SHA and repeat the complete gate on merged `main`.
12. Visible M1.07 work requires owner/browser testing before the brick is DONE.

## Explicitly blocked during M1.07

- M1.08 Company registration/verification and all later Milestone 1 bricks.
- M2.02 reviewer-facing identity/evidence queues.
- Assessments, integrity monitoring, written scoring, interviews, decisions, credentials, billing and later Milestone 2/3 workflows.
- Fake production activation for SMS/private-object storage/malware/liveness/face/video/payment providers.

## Permanent build procedure

- Reproduce defects before fixing them and trace the real state/data/permission boundary.
- Fix the smallest complete root cause and add permanent regression coverage.
- Keep one internal subunit active at a time.
- Lower-layer tests stay pinned to their accepted migration ceiling; the full application/release gate always applies the complete migration stack.
- Run focused checks early and the complete gate before merge.
- Merge only an exact verified head, then run the complete gate on merged `main`.
- Require browser testing only for genuine visible behavior, but never waive it when visible M1.07 UX is affected.
- Start Subunit 4 only after Subunit 3 passes exact-head implementation, merged-main verification and separate closure verification; never start M1.08 while any M1.07 release blocker remains.
