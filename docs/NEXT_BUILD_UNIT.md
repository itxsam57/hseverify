# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. The frozen product scope remains the **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records accepted brick history and build order. Earlier Version 10/prototype code is capability reference only and is not an architectural dependency.

## Accepted brick gates

- Worker Dashboard and Worker Profile vertical slice — **PASS — 2 August 2026**; accepted slice only, not the complete M1.07 brick.
- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS — 2 August 2026**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS — 2 August 2026**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS — 4 August 2026**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS — 6 August 2026**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS — 9 August 2026**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS — 10 August 2026**.

## M1.07 accepted Subunit 1

**Identity Domain, Versioned Persistence and State Machine — DONE — ENGINEERING PASS — 10 August 2026.**

Accepted evidence:

- implementation PR `#57`;
- exact implementation head `f7ca497d5becdf7f0a828943c833a8e8915278b6`;
- exact-head full engineering gate `31374028751` — **PASS**;
- implementation merge `19a5ccc877834e78a6568a75099484aebdec0d1c`;
- merged-main full engineering gate `31374492294` — **PASS**;
- browser/owner test — **NOT REQUIRED** because Subunit 1 introduces no browser-visible product surface;
- permanent Subunit 1 regressions include REG-073 and REG-074.

Subunit 1 established a separate versioned Worker identity aggregate, server-authoritative lifecycle rules, immutable submitted versions, Worker self-ownership from live role-bound authentication authority, optimistic concurrency, atomic bounded audit facts, monotonic migration/restart behavior and regression-safe dependency-injected runtime testing. Identity history does not physically depend on rollback-owned authentication tables.

## Milestone 1 progress

**6 of 12 Milestone 1 bricks are DONE.**

M1.07 remains the only active brick. M1.08 and later bricks remain blocked until the complete M1.07 brick is accepted.

Current accepted canonical `main` after M1.07 Subunit 1 implementation:

`19a5ccc877834e78a6568a75099484aebdec0d1c`

## Current build gate

# M1.07 — WORKER ONBOARDING AND IDENTITY ENGINE — IN PROGRESS

The previously owner-passed Worker Dashboard/Profile slice is a reusable prerequisite only. It does **not** make M1.07 complete. Identity is a separate versioned, server-authoritative domain and must not be hidden inside the general Worker profile JSON document.

### Canonical M1.07 outcome

A Worker can build and submit a versioned identity record using verified account/contact context and secure M1.06 file references; the system can run deterministic automated checks, surface duplicate signals without auto-merging, preserve immutable submitted versions/corrections, and issue a permanent Worker ID only after the required identity and duplicate gates are satisfied. Reviewer-facing verification queues remain M2.02 and must not be pulled forward.

## M1.07 internal subunits

1. **Identity Domain, Versioned Persistence and State Machine — DONE.**
   - separate `worker_identities` aggregate and `worker_identity_versions` persistence;
   - server-authoritative canonical lifecycle guards in TypeScript and SQL;
   - immutable submitted versions and correction-lineage constraints;
   - Worker self-ownership from the authenticated principal and live session revalidation;
   - optimistic concurrency through server-owned lock versions;
   - atomic platform audit facts for identity creation/material state transitions;
   - deterministic migration, monotonic rollback/reapply and PGlite close/reopen proof;
   - no identity document fields, secure-file evidence, liveness/provider checks, duplicate logic, Worker ID or visible identity page were introduced in this subunit.

2. **Worker Identity Draft and Verified Contact Binding — READY TO BUILD.**
   - legal/previous name, date of birth, nationality/residence and required identity metadata;
   - verified email from authentication authority and verified phone/contact authority where available;
   - contact verification timestamps and normalized destinations come from the server-owned authentication account only;
   - no client claim may upgrade an unverified contact into verified identity evidence;
   - draft writes remain Worker-self scoped, versioned, concurrency-safe and auditable.

3. **Secure Identity Document, Profile Photo and Selfie Evidence Binding — BLOCKED by Subunit 2.**
   - reuse M1.06 secure-file reservation/upload/scan/access infrastructure;
   - bind only server-authorized `available` files owned by the Worker;
   - document type/number/issue/expiry metadata, photo/selfie references and version history;
   - never duplicate file bytes in relational identity rows.

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
   - `/worker/identity` route and accessible/responsive state-aware UX;
   - correction requests create new versions instead of destructively overwriting accepted history;
   - loading/empty/validation/failure/permission-denial states;
   - complete restart/concurrency/isolation/security regression coverage;
   - genuine owner/browser live test before M1.07 closes.

## M1.07 state model to preserve

Canonical identity lifecycle:

- `DRAFT -> SUBMITTED`;
- `SUBMITTED -> AUTOMATED_CHECKS` or `WITHDRAWN` only before review starts;
- `AUTOMATED_CHECKS -> MANUAL_REVIEW | MORE_INFO | REJECTED`;
- `MANUAL_REVIEW -> VERIFIED | MORE_INFO | REJECTED | ESCALATED`;
- `MORE_INFO -> MANUAL_REVIEW`;
- `VERIFIED -> CORRECTION_PENDING | EXPIRED_DOCUMENT | SUSPENDED`;
- `CORRECTION_PENDING -> VERIFIED` through a new accepted version or rejected correction;
- `SUSPENDED -> VERIFIED/REINSTATED | CLOSED` according to authorized recovery policy.

No additional outbound transition from `REJECTED`, `ESCALATED`, `EXPIRED_DOCUMENT`, `REINSTATED`, `CLOSED` or `WITHDRAWN` may be invented merely to make a test convenient. Later policy may extend the graph only through an explicit canonical decision.

This brick may create the backend state and Worker-facing status/projection required by the frozen scope. It must **not** create M2.02 reviewer queue/assignment UI merely because `MANUAL_REVIEW` is a valid identity state.

## M1.07 non-negotiable controls

1. Worker identity data and evidence are highly sensitive; raw identity document/photo/selfie bytes remain private M1.06 objects, never JSON/base64/relational blobs/public URLs.
2. Identity ownership comes from the authenticated Worker principal; browser input never chooses account, role, tenant, storage key/provider, reviewer or decision authority.
3. Submitted identity versions are immutable. Corrections create explicit new versions/lineage and retain prior accepted facts.
4. Duplicate detection produces signals/outcomes; it never silently merges accounts or identities.
5. Permanent Worker ID issuance is server-authoritative, unique, idempotent and gated by verified identity plus duplicate resolution.
6. Provider-dependent liveness/face/document verification is behind adapters. Local/test adapters are deterministic; preview/production fail closed until approved providers/credentials exist.
7. AI/provider output cannot be the sole final verification/rejection/merge decision.
8. Every material transition, duplicate disposition and Worker-ID issuance has bounded immutable audit evidence without raw document numbers, tokens, object keys, hashes or image bytes in audit metadata.
9. M1.03 role isolation, M1.04 authorization/tenant rules, M1.05 audit/outbox foundations and M1.06 private-file rules may not be weakened or duplicated.
10. Every serious reproduced defect receives a stable regression guard before its subunit closes.
11. The exact branch head must pass focused and complete fail-closed engineering gates; merge only that SHA and repeat the complete gate on merged `main`.
12. Visible M1.07 work requires owner/browser testing before the brick can be marked DONE.

## Explicitly blocked during M1.07

- Company registration/verification from M1.08.
- Sites/departments/team from M1.09.
- Business Worker invitation/Company-code workflow from M1.10.
- Employment/experience/qualification/skill/leaving-letter records from M1.11.
- Public verification from M1.12.
- Reviewer-facing evidence/identity queues from M2.02.
- Assessments, integrity monitoring, written scoring, interviews, decisions, credentials, billing and all later Milestone 2/3 workflows.
- Fake production activation for SMS/private-object storage/malware/liveness/face/video/payment providers.

## Permanent build procedure

- Reproduce defects before fixing them and trace the real state/data/permission boundary.
- Fix the smallest complete root cause and add permanent regression coverage.
- Keep one internal subunit active at a time.
- Run focused checks early and the complete gate before merge.
- Merge only an exact verified head, then run the complete gate on merged `main`.
- Require owner/browser testing only for genuine visible behavior, but never waive it when visible M1.07 UX is affected.
- Start Subunit 2 only after this Subunit 1 closure passes exact-head and merged-main verification; never start M1.08 while any M1.07 release blocker remains.
