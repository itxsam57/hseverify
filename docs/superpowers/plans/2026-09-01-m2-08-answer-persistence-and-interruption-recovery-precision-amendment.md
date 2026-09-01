# M2.08 Implementation Plan Precision Amendment

This document is a binding precision amendment to `docs/superpowers/plans/2026-09-01-m2-08-answer-persistence-and-interruption-recovery.md`.

It does **not** change the owner-approved M2.08 product/design scope. It resolves three implementation ambiguities found during plan self-review against verified `main` commit `768169e94831dbf29cb0335f11148ffb9dc79b92`. Where the base plan conflicts with this amendment on the three subjects below, this amendment supersedes the ambiguous base-plan wording.

## 1. Exact M2.05 randomized-form regression command

Task 6 of the base plan must not use the non-existent placeholder paths `tests/platform/assessment-form-generation-contract.test.mjs` or `tests/platform/assessment-form-generation-runtime.test.mjs`, and must not use the hedge “if the exact M2.05 runner names differ”.

The exact current repository regression command is:

```bash
node --test tests/platform/randomized-assessment-form-contract.test.mjs tests/platform/randomized-assessment-form-integrity.test.mjs tests/platform/randomized-assessment-form-rollback.test.mjs tests/platform/randomized-assessment-form-runtime.test.mjs tests/platform/randomized-assessment-selector-matching.test.mjs tests/platform/randomized-assessment-cross-case-race.test.mjs
npm run typecheck
npm run lint
```

These six existing tests are the complete current `randomized-assessment-*` platform regression surface. M2.08 successor/replacement recovery must keep them green, especially the existing Worker/question non-repeat and cross-case race protections. Do not create a new M2.05 alias merely to satisfy this plan.

## 2. Exact opaque recovery owner-handle derivation

`src/lib/assessment-attempt/assessment-recovery-owner.ts` must be server-only and reuse the repository's already-required production authentication pepper. M2.08 must **not** add a new deployment secret.

Use the existing repository primitives exactly:

```ts
import "server-only";

import { hashOpaqueValue } from "@/lib/auth/auth-domain";
import { getServerEnvironment } from "@/lib/config/server-environment";

const ASSESSMENT_RECOVERY_OWNER_CONTEXT = "hse-assessment-recovery-owner-v1";

export function createAssessmentRecoveryOwnerHandle(accountId: string): string {
  return hashOpaqueValue(
    accountId,
    getServerEnvironment().authPepper,
    ASSESSMENT_RECOVERY_OWNER_CONTEXT
  );
}
```

Required tests:

- the same account ID and pepper produce the same handle;
- different account IDs produce different handles;
- a different pepper produces a different handle;
- the raw account ID is not embedded in the handle;
- the helper cannot be imported into a client bundle because it is `server-only`;
- only the resulting opaque handle, never `accountId` or `HSE_AUTH_PEPPER`, may be sent to the browser for recovery-store scoping.

Repository basis: `.env.example` already defines `HSE_AUTH_PEPPER` separately from `HSE_SESSION_SECRET`; `validateRuntimeEnvironment` requires an explicit auth pepper in production; `hashOpaqueValue(value, pepper, context)` already performs domain-separated HMAC-SHA256.

## 3. Exact Emergency Exit / report-and-exit wait budget

Emergency Exit and Technical Issue `EXIT` must never trap the Worker behind an indefinitely pending server action.

The client-side exit sequence is exactly:

1. Persist the current draft to encrypted IndexedDB first.
2. Await the server draft flush for at most **1,500 ms**.
3. Await the interruption operation (or the report-and-interrupt operation for Technical Issue `EXIT`) for at most **1,500 ms**.
4. Enforce an aggregate **3,000 ms maximum server-wait budget** for the exit path.
5. Navigate to `/worker/dashboard` in `finally`, regardless of timeout, network failure, or server-action failure.

Implement a small client-only deadline helper using `Promise.race`. The deadline means **stop waiting in the UI**; it is not represented as guaranteed network cancellation. A late server mutation may still complete and therefore every involved mutation remains idempotent under the already-approved mutation-key rules.

Required tests must prove:

- local encrypted persistence is attempted before either server wait;
- a never-resolving draft flush cannot block navigation beyond the 3,000 ms aggregate contract;
- a never-resolving interruption/report operation cannot block navigation beyond the aggregate contract;
- a fast success path waits for both server operations before navigation;
- timeout/failure does not falsely label the server state as saved/interrupted;
- navigation occurs from `finally` on success, rejection, or deadline;
- late duplicate server completion is harmless because the mutation keys are reused idempotently.

Use fake timers in the unit/contract tests; do not make the automated suite sleep for real 1.5/3 second intervals.

## Plan self-review verdict after this amendment

`PASS_AFTER_CORRECTION`, provided implementation uses the base plan **plus this amendment** as one plan bundle.

Resolved findings:

1. non-existent/hedged M2.05 regression paths -> replaced by six exact existing randomized-assessment test files;
2. unspecified owner-handle secret -> pinned to existing production-required `HSE_AUTH_PEPPER` via existing `hashOpaqueValue`, with explicit context separation and no new secret;
3. unspecified Emergency Exit deadline -> pinned to 1,500 ms + 1,500 ms with a 3,000 ms aggregate maximum and unconditional `finally` navigation.

No `TODO`, `TBD`, “if names differ”, or owner-choice placeholder remains in this amendment. No production code, migration, test, package, or workflow behavior is changed by this documentation-only amendment.