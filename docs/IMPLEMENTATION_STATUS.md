# Implementation Status

## Milestone 1

- M1.01 Repository, Environments and CI/CD — **DONE**.
- M1.02 Design System and Global UX — **DONE**.
- M1.03 Authentication and Portal Isolation — **DONE**.
- M1.04 Authorization and Tenant Isolation — **DONE**.
- M1.05 Audit and Notification Foundations — **DONE**.
- M1.06 Secure Storage and Upload Pipeline — **DONE**.
- M1.07 Worker Onboarding and Identity Engine — **IN PROGRESS**.
  - Subunit 1 — **DONE**.
  - Subunit 2 — **DONE**.
  - Subunit 3 — **DONE**.
  - Subunit 4 Automated Identity Checks and Provider Adapter Boundary — **DONE — ENGINEERING PASS**.
  - Subunit 5 Duplicate Signals, Recovery and Worker-ID Eligibility — **DONE — ENGINEERING PASS**.
  - Subunit 6 Correction Versions, Worker Identity UX and Cumulative Acceptance — **IN PROGRESS**.
- M1.08 through M1.12 — **BLOCKED in canonical order**.

**Milestone 1 progress: 6 of 12 bricks are DONE.**

## Accepted boundary through S5

The accepted clean rebuild includes authentication and role isolation, tenant authorization, immutable audit/outbox/notifications, secure private uploads and access, versioned Worker identity, verified contact snapshots, secure identity evidence binding, automated-check provider boundaries, conservative duplicate signals/recovery dispositions and verified-only permanent Worker-ID eligibility/issuance.

S5 acceptance evidence:

- implementation PR `#66`;
- exact final implementation head `8d7d3485a4d1f8017e0b5f0dab46ef8d9be5cb8c`;
- exact-head full gate `31415441023` — **PASS**;
- implementation merge `538948402c703970fe6f6d84ab3a6e8cf61d8ab8`;
- merged-main full gate `31431146567` — **PASS**;
- closure PR `#67`, exact closure head `87a90dced3b03c79e709f8ff6ca21923c3a5fa97`, exact-head gate `31432224808` — **PASS**;
- closure merge `b7e9b7cd68a7ba4fd6227bf266c6fa89c0a2fd0a`, merged-main gate `31432693829` — **PASS**;
- permanent evidence `docs/testing/results/M1_07_SUBUNIT5_ACCEPTANCE.md`;
- browser test **NOT REQUIRED** because S5 added no visible product surface.

The cumulative visible browser baseline was reported **PASS — 10 August 2026**. It is not repeated for internal-only S4/S5.

## Active work — M1.07 Subunit 6

S6 is actively building immutable correction versions and the real Worker-only `/worker/identity` workflow. Current implementation scope includes:

- a new correction version instead of overwriting any accepted submitted version;
- immutable correction request, decision and evidence-origin history;
- monotonic version numbering so a rejected correction version is never reused;
- current verified parent restoration after a rejected correction while preserving the rejected version;
- server-derived verified email/phone display and S2 optimistic draft revisions;
- M1.06 private upload/quarantine/malware-scan flow plus S3 same-Worker evidence binding;
- initial identity submission/withdrawal, S4 assistive automated checks and bounded S5 duplicate/Worker-ID status;
- no reviewer decision UI and no M1.08 work;
- focused S6 tests plus cumulative M1.07 migration/route acceptance.

The S6 implementation branch must pass focused and complete exact-head automation, then merged-main automation. Because S6 is browser-visible, the next mandatory stop is the targeted owner/browser test of `/worker/identity`. M1.07 cannot close and M1.08 cannot start before that owner PASS.

The exact current gate is `docs/NEXT_BUILD_UNIT.md`. The permanent build order is `docs/bookmarks/MILESTONE_PATH.md`.
