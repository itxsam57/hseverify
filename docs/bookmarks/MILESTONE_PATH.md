# Bookmark: Milestone Path

## Authority

This file is the permanent build-order and acceptance record for HSE Verify Phase 1.

The controlling source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, chats, summaries and discarded implementations may explain intent but cannot override it.

## Brick gate

A brick is DONE only after:

1. complete canonical implementation;
2. complete automated validation;
3. owner hard testing;
4. migration/rollback evidence where applicable;
5. clean shutdown and Git state;
6. no unresolved release-blocking owner defect.

The next brick may not begin before the current brick is DONE. Internal subunits may advance only after their own implementation, automated and owner gates pass.

## Accepted owner gates

### Worker Dashboard and Worker Profile vertical slice

- **Owner result:** PASS — 2 August 2026.
- **Boundary:** accepted M1.07 subunits only; M1.07 remains PARTIAL.

### M1.01 — Repository, Environments and CI/CD

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #5, PR #6 and PR #7.
- **Maintenance:** `LATER-044` retains the tested PostCSS/Sharp compatibility overrides.

### M1.02 — Design System and Global UX

- **Status:** DONE — OWNER PASS — 2 August 2026.
- **Implementation chain:** PR #8 through PR #14.
- **Final record:** `docs/testing/results/M1_02_FINAL_OWNER_ACCEPTANCE.md`.

### M1.03 — Authentication and Portal Isolation

- **Status:** DONE — OWNER PASS — 4 August 2026.
- **Implementation and repair chain:** authentication PRs through merge `403056b85f52b7e2c656b0585b6ced50fdad140a`.
- **Final record:** `docs/testing/results/M1_03_FINAL_OWNER_ACCEPTANCE.md`.

### M1.04 — Authorization and Tenant Isolation

- **Status:** DONE — OWNER PASS — 6 August 2026.
- **Final implementation pull request:** #34.
- **Final implementation merge:** `4329a591dfa7d1e7c4fca3feb5dd33c873984574`.
- **Owner-tested commit:** `56973430099171ebc48d2f4cc96887b58486167b`.
- **Final control merged-main run/job:** `31070230847` / `92516468358` — PASS.
- **Final record:** `docs/testing/results/M1_04_FINAL_OWNER_ACCEPTANCE.md`.
- **Resolved requirements:** `LATER-011`, `LATER-012`, `LATER-013`.
- **Resolved owner defects:** `LATER-OWNER-012`, `LATER-OWNER-016`.

Accepted M1.04 internal subunits:

1. Authorization domain and tenant schema foundation — DONE — OWNER PASS.
2. Session authorization context and permission checks — DONE — OWNER PASS.
3. Tenant-scoped repository/query/command guards — DONE — OWNER PASS.
4. Company-scope bootstrap fixtures and protected demonstration surfaces — DONE — OWNER PASS.
5. Complete cross-role/cross-tenant endpoint, concurrency, rollback and final acceptance suite — DONE — OWNER PASS.

Accepted M1.04 boundary includes:

- explicit wildcard-free permission matrices and opaque tenant/membership identities;
- one trusted Company tenant context derived from the database session;
- fixed-role portal and direct-endpoint isolation;
- tenant scope directly in every accepted tenant-owned SQL read and mutation;
- transactional lifecycle and permission revalidation;
- non-enumerating missing, malformed and cross-tenant results;
- scoped uniqueness, optimistic concurrency and stale-authority denial;
- synthetic protected Company tenant demonstration without a browser scope selector;
- deterministic/idempotent migrations `0005` and `0006`, rollback/reapplication and persistent PGlite proof;
- permanent six-role, eleven-endpoint, concurrency and rollback regression suites.

## Current brick

# M1.05 — Audit and Notification Foundations

**Status: READY TO BUILD**

M1.05 is the only permitted implementation brick. M1.06 and later bricks are blocked.

### Canonical completion requirement

Complete the immutable platform audit engine, transactional outbox/background-job foundation, persisted in-app notifications with exact authorized deep links, and durable provider-neutral email queue/delivery state.

Existing authentication security events and demonstration dashboard notifications are partial inputs only. They do not complete M1.05.

### Current internal subunit

# Subunit 1 — Immutable Audit Domain, Schema and Append-Only Repository Foundation

**Status: READY TO BUILD**

The first M1.05 subunit must:

1. define the shared typed audit vocabulary and event contract;
2. preserve and integrate the accepted authentication security-event boundary rather than replacing or forking it;
3. add opaque audit identifiers, server timestamps and trusted actor/role/tenant context;
4. persist append-only audit facts with no normal product update/delete path;
5. exclude secrets, OTP/TOTP values, raw tokens and private document content;
6. add bounded authorized queries with tenant-safe non-enumerating behavior;
7. prove deterministic migration, rollback/reapply, persistence, concurrency and source contracts;
8. enter the permanent fail-closed application gate;
9. preserve all M1.03 and M1.04 security boundaries;
10. avoid building later outbox, visible notification and email-delivery subunits early except for stable interfaces strictly required to prevent redesign.

### Remaining M1.05 capability order

1. Immutable audit domain, schema and append-only repository foundation — **READY TO BUILD**.
2. Transactional outbox and idempotent background-job execution — **BLOCKED**.
3. Persisted in-app notifications, read state and exact role-safe deep links — **BLOCKED**.
4. Durable provider-neutral email queue, retries and delivery state — **BLOCKED**.
5. Complete cumulative security, migration and owner acceptance — **BLOCKED**.

### M1.05 non-negotiable controls

- Audit actor, role, tenant, membership, action, outcome and timestamp are server-derived.
- Audit history is append-only; correction uses linked compensating/superseding facts.
- Accepted state and required audit facts must not diverge through partial failure.
- Outbox and delivery processing must be idempotent and safely retryable.
- Notification destinations must be exact, authorized and unable to cross roles or tenants.
- Cross-tenant audit/notification/delivery records remain non-enumerating.
- Live email provider credentials remain blocked until local/test queued delivery passes.
- No M1.06 upload or later business workflow may be built early.

## Milestone 1 status

| Brick | Capability | Status | Remaining gate |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | DONE | Compatibility override maintenance under `LATER-044`. |
| M1.02 | Design system and global UX | DONE | Accepted 2 August 2026. |
| M1.03 | Authentication and portal isolation | DONE | Accepted 4 August 2026. |
| M1.04 | Authorization and tenant isolation | DONE | Accepted 6 August 2026. |
| M1.05 | Audit and notification foundations | PARTIAL — READY TO BUILD | Complete audit, outbox/jobs, persisted notifications/deep links and queued email delivery state. |
| M1.06 | Secure storage and upload pipeline | NOT STARTED | Blocked until M1.05 DONE. |
| M1.07 | Worker onboarding and Identity Engine | PARTIAL | Resume only after M1.06. |
| M1.08 | Company registration and verification | NOT STARTED | Tenant security foundation accepted in M1.04. |
| M1.09 | Sites, departments and team | NOT STARTED | Requires accepted tenant model and scoped permissions. |
| M1.10 | Worker invitations and Company codes | PARTIAL | Staff provisioning does not complete operational invitations/codes. |
| M1.11 | Employment, experience, qualification, skill and leaving-letter records | NOT STARTED | Requires secure upload and tenant boundaries. |
| M1.12 | Public verification foundation | PARTIAL PROTOTYPE | Real lookup, safe projection, concern reporting, rate limits and QR base remain. |

**Phase 1 progress: 4 of 12 Milestone 1 bricks are DONE.**

## Correct execution order

1. Build and owner-accept M1.05 internal subunits in order.
2. Complete M1.06 through M1.12 in order.
3. Pass the complete Milestone 1 exit test.
4. Begin Milestone 2 only after Milestone 1 is DONE.

## Canonical roadmap

### Milestone 1 — Platform Foundation, Identity and Company Trust

M1.01 through M1.12 remain frozen in the master specification.

**Exit gate:** a Worker can securely register, verify contact information, submit identity/evidence, receive a permanent Worker ID, join a verified Company and appear in its directory. Portal isolation, tenant isolation, audit and secure uploads must pass security testing.

### Milestone 2 — Assurance, Assessments, Review and Interviews

M2.01 through M2.15 remain frozen. They include Assurance Cases, evidence verification, frameworks/effective policy, MCQ and written Question Bank, randomized non-repeating forms, one-question assessment delivery, answer persistence/recovery, integrity monitoring, review, interviews, decisions, appeals and credential issuance.

### Milestone 3 — Operations, Billing, Intelligence and Production Launch

M3.01 through M3.10 remain frozen. They include reassessment/renewal, payments/payouts, subscriptions, finance, reporting, advanced administration, compliance hardening, performance/accessibility and production activation.