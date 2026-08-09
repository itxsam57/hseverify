# REG-034 — Shared outbox handler arguments must not collide with feature dependency injection

## Status

**DISCOVERED — FIX IN PROGRESS — 9 August 2026**

## Defect

The complete application TypeScript gate rejected the M1.05 Subunit 4 outbox handler registry after the shared worker contract was extended to pass a trusted outbox lease as the second handler argument. The existing notification projector already uses its second argument for optional test/runtime dependency injection (`database` and `repository`). Assigning that projector directly into the shared `(job, lease)` registry therefore made the trusted lease structurally collide with an unrelated dependency-injection slot.

## Root cause

Feature handlers were assigned directly into one shared registry even though their public call signatures have different meanings beyond the job argument. The central worker correctly needs one standardized `(job, trustedLease)` execution contract, but feature-specific functions must adapt to that contract explicitly rather than relying on accidental structural compatibility.

## Expected behavior

- The central outbox worker owns one explicit `(job, trustedLease)` handler contract.
- The notification adapter accepts the shared lease but deliberately does not pass it into the notification projector dependency-injection parameter.
- The email adapter forwards the same trusted lease to the email-delivery handler, where lease ownership is security-critical.
- Feature dependency injection remains internal to the feature and cannot receive a worker lease accidentally.
- No `any`, unsafe cast, or weakened TypeScript setting is used to silence incompatibility.
- Full-project TypeScript, focused outbox/notification/email checks, runtime email tests and production build must all remain green.

## Permanent guard required

The fix must be guarded by:

- an explicit source contract in the outbox foundation checker proving notification and email handlers are adapted separately;
- full-project `typecheck` inside the complete application gate;
- the existing notification and real email-delivery runtime regression suites.

This regression is not considered protected until the exact repaired PR head passes the complete engineering gate.
