# Next Build Unit

## Authority

This is the exact current implementation gate for the HSE Verify Phase 1 clean rebuild. Frozen authority remains **HSE Verify Master Product, Feature, Workflow, UX and Engineering Specification — Phase 1 Frozen Scope — 1 August 2026**. `docs/bookmarks/MILESTONE_PATH.md` records permanent order and accepted history.

## Accepted release beneath the active brick

- M1.01 — DONE — OWNER PASS.
- M1.02 — DONE — OWNER PASS.
- M1.03 — DONE — OWNER PASS.
- M1.04 — DONE — OWNER PASS.
- M1.05 — DONE — OWNER PASS.
- M1.06 — DONE — ENGINEERING PASS.
- M1.07 — DONE — OWNER PASS — 11 August 2026.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- M1.09 Sites, Departments and Company Team — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED**.
- M1.10 Worker Invitations and Company Codes — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO M1.13**.

M1.10 release evidence:
- PR `#76`;
- final exact verified head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`;
- M1.10 targeted gate `31971156192` — PASS;
- exact-head full Engineering gate `31971157867` — PASS;
- expected-head-locked merge `3b32287fecb30f16d682cb130be0e8f1eb466616`;
- merged-main full Engineering gate `31971506738` — PASS.

The owner requested one combined **Milestone 1** browser acceptance after M1.12 is engineering-green. This is a test deferral, not an owner PASS. Formal Milestone 1 DONE count therefore remains **7 of 12** until that combined acceptance succeeds.

## Current build gate

# M1.11 — EMPLOYMENT, EXPERIENCE, QUALIFICATION, SKILL AND LEAVING RECORDS — IN PROGRESS

M1.11 is the **only permitted product brick** now.

### Canonical outcome

A Worker can use `/worker/evidence` to create and manage qualification, experience, employment and skill records, attach evidence through the accepted secure upload pipeline, end/inactivate records without deleting history, and attach a leaving letter to the exact employment record. Qualification metadata and its primary certificate remain part of one integrated draft and cannot lose association.

### Non-negotiable controls

1. Worker ownership is derived from the live Worker session. Browser-supplied account/owner authority is never trusted.
2. Qualification metadata, primary certificate and supporting evidence bind to the exact record/version. A file uploaded for one qualification cannot appear in another qualification.
3. Experience and employment support multiple companies/records. Date ranges are validated and records never overwrite one another.
4. Ending employment records end date/reason and preserves previous versions/history. There is no destructive employment/evidence delete path.
5. Skills keep `self_declared`, `evidence_verified` and `competency_assessed` distinct. Worker writes in M1.11 cannot self-promote beyond `self_declared`, even when evidence is attached.
6. Leaving letters bind to one exact employment. A leaving letter for Employer A cannot appear in Employer B. Genuine PDF/image evidence uses M1.06 and multi-page PDF remains supported by the existing PDF pipeline.
7. Drafts are editable only by the owning Worker. Submitted versions are immutable; later edits create a new draft/version and preserve accepted history.
8. M1.06 secure file reservation, private storage, MIME/size validation, quarantine, malware-scan adapter and signed-access architecture are reused. M1.11 must not create another uploader or public file path.
9. A secure file must be owned by the authenticated Worker, scan-available and carry the exact server-generated record/version/attachment business reference before binding.
10. Cross-Worker copied record/version/file IDs fail safely without enumeration.
11. Material transitions use centralized immutable audit with the true Worker actor.
12. Retained M1.11 compliance-history tables must not own hard foreign keys into reversible lower bricks. Lower-brick rollback/reapply remains testable.
13. `/worker/evidence` is discoverable from Worker navigation and relevant dashboard actions. No successful mutation requires manual refresh.
14. M1.11 server-action modules export async actions only; shared client action state lives outside `"use server"` files.
15. Permanent tests cover cross-form file leakage, cross-Worker access, multiple employers, history preservation, skill status separation, leaving-letter scoping, concurrency/stale edits, migration/restart and lower-brick compatibility.
16. Reviewer evidence-verification queues/decisions remain M2.02. Public verification remains M1.12. Assessment eligibility remains M2.06.

## Explicitly blocked while M1.11 is active

- M1.12 Public Verification Foundation.
- M2.01 Assurance Order and Case Engine.
- M2.02 Reviewer Evidence Verification Queues and verification decisions.
- M2.03–M2.13.
- M3.01–M3.12.
- Fake production activation of email/SMS/private-object/malware/liveness/face/document/video/payment providers.

## M1.11 release gate

Before advancing to M1.12:
1. finish M1.11 implementation and permanent regressions;
2. pass complete exact-head M1.11 targeted and full Engineering gates;
3. independently review scope, authorization, file binding, history, migration and UX on an immutable SHA;
4. Gatekeeper-accept only that exact SHA;
5. merge only that exact verified head;
6. pass complete merged-main Engineering gate;
7. recheck `main` did not drift during verification.

Owner/browser acceptance remains deferred to M1.13. Engineering-green M1.11 may advance to M1.12 without an intermediate browser stop.

## Permanent procedure

Root-cause fixes only. Never weaken an accepted test or historical constraint to fit new code. Keep one active brick. Use exact-head CI, expected-head merge locks and merged-main verification. Owner/browser PASS must always be tied to an exact release.
