# HSE Verify Engineering Memory

This file is the compact build memory for the active clean rebuild. It is not a diary and must not duplicate the full master specification.

## Current build position

- Canonical scope: Phase 1 master specification dated 1 August 2026.
- Repository: `itxsam57/hseverify`, branch `main`.
- M1.01 Platform Foundation: owner accepted.
- M1.02 Design System and Global UX: owner accepted.
- M1.03 Authentication and Portal Isolation: implementation merged; owner hard test in progress.
- M1.03 Worker public registration and mandatory email + phone OTP: owner PASS on 4 August 2026.
- `LATER-OWNER-010`: resolved and owner accepted.
- Next owner hard-test section: Worker fixed-role sign-in and session management.
- M1.04 remains blocked until the complete M1.03 owner hard test passes.

## Build priority rule

1. Build and hard-test the working domain backbone, dashboards and role-to-role workflow first.
2. Do not spend a milestone rebuilding final marketing polish, decorative cards or production provider setup.
3. Do not remove a required future feature. Give it a stable interface, one integration entry point and a truthful disabled/sandbox state.
4. Complete final public-site design, visual polish, payment activation, live messaging, live video and other providers in their scheduled production bricks.
5. A provider failure must never corrupt the core workflow.

## Editable content rule

Candidate-facing descriptions, card guidance and temporary product wording belong in central copy registries rather than being scattered through components.

Current registry:

- `src/config/product-copy.ts`

New modules should add their editable copy there or in a clearly named sibling registry under `src/config/`.

## Integration entry points

- Worker registration and OTP state machine: `src/lib/auth/worker-registration-service.ts`
- Worker registration persistence and typed flow transitions: `src/lib/auth/worker-registration-repository.ts`
- Development OTP inbox: `src/lib/auth/auth-sandbox-service.ts`
- Deferred integration map: `src/config/product-copy.ts` under `DEFERRED_INTEGRATIONS`

A production email/SMS provider must replace only the delivery boundary. It must not rewrite registration states, OTP hashing, challenge expiry, rate limits or account activation.

## Code bookmark format

Use a stable comment immediately above non-obvious workflow boundaries:

```text
BUILD-PIN <MODULE>-<FLOW>-<PURPOSE>:
```

Each pin must explain:

- why the code exists;
- which workflow/state it protects;
- which files or provider boundary may be changed later;
- what must not be broken.

Do not add pins to obvious one-line rendering code. Pins are navigation anchors, not commentary on every line.

## Active authentication pins

- `AUTH-REG-OTP-POST` in `src/app/worker/register/verify/submit/route.ts`
  - Keeps OTP verification on a challenge-bound same-origin POST with a 303 redirect.
- `AUTH-REG-OTP-ERROR-BOUNDARY` in `src/app/worker/register/verify/submit/route.ts`
  - Keeps expected registration errors separate from unexpected database/invariant failures.
- Typed flow-transition regression in `tests/platform/worker-registration-flow-sql.test.mjs`
  - Protects email-to-phone and phone-to-complete timestamp writes.

## Defect protocol

1. Stop the owner test at the first real failure.
2. Create `LATER-OWNER-###` with the observed behavior and affected gate.
3. Fix the root cause on a branch.
4. Add or strengthen regression coverage.
5. Run the focused gate, then the full gate.
6. Merge and repeat the owner step.
7. Resolve the Later record only after the owner retest passes.

## Context-cleanliness rule

Future chats should load only:

- the master specification;
- this engineering memory;
- the milestone path/status;
- unresolved Later records;
- current repository evidence.

Old Version 10 and discarded implementations are historical capability references only.
