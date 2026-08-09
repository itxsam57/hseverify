# M1.05 Subunit 4 — Durable Email Queue, Delivery Attempts and Local/Test Provider Adapter

## Status

**IMPLEMENTATION AUTOMATED PASS — FINAL DOCUMENTATION HEAD VALIDATION PENDING — NOT DONE**

This subunit adds only the durable email-delivery foundation on top of the accepted M1.05 audit, transactional outbox and job-worker foundations. It does not activate a live SMTP/API provider, add provider credentials, introduce business-domain email templates, create an operational email dashboard, start Subunit 5 combined acceptance, or enter M1.06 scope.

## Implementation pull request

- Pull request: `#43`.
- Branch: `build/m1-05-email-delivery-foundation`.
- Base: the accepted Subunit 3 closure on `main`.
- Validated implementation head: `831702670a4b2c3f23fad3c9eca0301148b3e0f1`.
- Engineering run: `31316549538`.
- Validation job: `93252630064`.
- Complete application gate: **PASS**.
- Deployable preview smoke: **PASS**.
- Release evidence manifest: **PASS**.
- The pull request remains **draft** until the final documentation head independently passes the same complete engineering gate.

## Implemented boundary

1. Migration `0010_email_delivery_foundation` creates one durable logical delivery store and one immutable delivery-attempt history.
2. One fixed outbox type, `email.delivery.foundation`, uses the already-accepted outbox worker, lease, retry, reclaim and terminal-failure engine rather than adding a second scheduler.
3. Queue creation and its required outbox work commit transactionally.
4. Recipient identity, role and Company tenant/membership scope are derived from trusted server context.
5. The verified recipient address is resolved server-side for dispatch and is not persisted in the outbox payload, delivery history, immutable audit metadata or normalized provider result.
6. The delivery store persists only a SHA-256 recipient-address fingerprint for durable correlation.
7. Delivery and attempt identifiers, dispatch keys and provider-reference hashes are server-derived opaque values.
8. Delivery attempts are bound to the exact live outbox worker and lease before they may start or finish.
9. The logical delivery record preserves queued, processing, retry-wait, delivered and terminal-failed state while attempt history remains append-only.
10. Provider results are normalized into fixed success/retry/terminal contracts with bounded safe result codes and summaries.
11. The only adapter is the deterministic `local_test` adapter, permitted only in development/test environments and performing no network call.
12. The real runtime regression invokes the actual outbox repository, email repository, email handler, local/test adapter, audit writes and PGlite database together.
13. Recipient/role/Company-tenant operational reads use direct SQL scope plus live authorization/session/membership revalidation and non-enumerating misses.
14. Email queued, attempt-started, delivered, retry-scheduled and terminal-failed lifecycle facts are written through the accepted immutable audit engine.
15. Migration `0010` is reversible and reapplicable without invalidating accepted immutable audit history or prior M1.05 data.

## Delivery semantics

The email foundation inherits the accepted outbox model: **at-least-once job execution with idempotent durable outcomes**. It does not claim exactly-once external transport.

A worker crash may cause an outbox lease to be reclaimed. The email layer therefore checks durable delivery state before dispatch and binds each attempt to the exact active lease so a stale worker cannot start or finalize work after ownership changes. A delivery already durably marked delivered or terminally failed is not dispatched again when the surrounding outbox job is reclaimed.

## Real-path automated scenarios

The runtime regression proves the actual server-module path rather than mocks alone:

- successful local/test delivery;
- one retry followed by success;
- five-attempt terminal failure;
- lease expiry and replacement-worker continuation;
- stale-worker start/finalize rejection;
- no duplicate dispatch after durable delivered/terminal state;
- immutable attempt and audit history;
- persistence through PGlite close/reopen;
- no plaintext recipient address in persisted delivery/attempt/audit state.

## Permanent regressions discovered during this build

### REG-027 — migration proof coupled to globally latest migration

Several accepted migration tests treated the migration they owned as if it would remain the repository-wide latest migration. The generic platform proof now derives the manifest dynamically, while owned authentication, authorization, M1.04, audit, outbox, notification and Worker-registration proofs preserve their own rollback guarantees beneath newer layers. The notification foundation projection test requires migration `0009` to be present rather than globally latest, and the Worker-registration proof now derives every later layer from the migration manifest before independently rolling registration migration `0003` back and reapplying it.

### REG-028 — stale/reclaimed email lease could start or finish work

Expired leases produce no email-attempt start row. A previously started attempt is reconciled to lease-expired state before a replacement lease advances the delivery. The stale worker cannot finalize after reclaim.

### REG-029 — duplicate attempt-start audit on re-entry

The repository reports whether the exact attempt row was newly created. The handler writes `email.delivery.attempt.started` only for a newly created attempt.

### REG-030 — redispatch after durable terminal email state

A reclaimed outbox job short-circuits from persisted delivered/terminal delivery state rather than calling the provider again.

### REG-031 — runtime test compiler semantics diverged from the application

The first real-path runner created a separate TypeScript compiler universe that mishandled Next.js `server-only` markers and ESM/CJS boundaries. That standalone runtime tsconfig was removed. The runtime runner now creates a temporary execution copy with deterministic TypeScript transpilation while the normal repository typecheck and production build remain authoritative for source typing/module semantics.

### REG-032 — PostgreSQL parameter inferred as both INTEGER and SMALLINT

The real PGlite handler path exposed that one email-attempt SQL parameter was compared against the accepted outbox attempt number (`INTEGER`) and inserted into email attempt history (`SMALLINT`). The repository now makes the trusted outbox comparison explicit with `outbox_attempts.attempt_number::smallint = $4`. The outbox attempt range is already constrained to 1–5, so the projection is safe and deterministic. The exact SQL contract and real runtime test permanently guard this defect.

### REG-033 — higher-layer fixtures violated accepted lower-layer invariants

The first email platform fixtures used repeated arbitrary letters as cryptographic-looking values and directly wrote an incomplete `lease_expired` outbox attempt state. Those fixtures failed accepted SHA-256/hex and outbox lifecycle constraints before the email assertions they were intended to test. The platform fixture layer now generates real deterministic SHA-256 values and performs lease-expiry transitions with the complete required lower-layer outcome, error and timestamp shape. No accepted schema constraint was weakened or bypassed.

### REG-034 — shared outbox lease collided with notification dependency injection

The full-project TypeScript gate caught that the existing notification projector's second argument means optional feature dependency injection, while the new shared worker contract's second argument is a trusted lease. The central worker now keeps one strict `(job, lease)` contract but adapts features explicitly: notification receives job only, while email receives job plus trusted lease. Focused source/unit contracts and the full TypeScript/build gate permanently protect this boundary.

## Explicit exclusions

- Live SMTP or email API provider.
- Provider secrets or production credentials.
- Arbitrary provider URL, module or browser-selected transport.
- User-visible email queue or operations dashboard.
- Business workflow email templates/types from later bricks.
- SMS delivery.
- M1.05 Subunit 5 final combined acceptance.
- M1.06 secure storage/upload work or any later milestone.

## Owner handoff

There is no new visible browser workflow. After the exact final PR head and merged-main gate pass, the owner runs only the command-line hard test in:

`docs/testing/M1_05_EMAIL_DELIVERY_FOUNDATION_HARD_TEST.md`

## Acceptance boundary

This document is **not** an owner acceptance record. Subunit 4 remains **NOT DONE** until:

1. the exact final PR head passes the complete engineering gate;
2. PR review confirms no temporary diagnostic automation, unsafe PII persistence, duplicate delivery authority, scope leakage or future-feature pull-forward;
3. that exact validated head merges to `main`;
4. the merged-main engineering gate passes;
5. the owner command-line hard test passes; and
6. the owner acceptance closure record is merged.

Until then M1.05 remains **IN PROGRESS**, Subunit 5 remains blocked, and M1.06 remains blocked.
