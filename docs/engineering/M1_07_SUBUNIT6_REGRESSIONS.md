# HSE Verify — M1.07 Subunit 6 Regression Addendum

This addendum records root-cause regressions discovered while closing M1.07 Subunit 6. These IDs are permanent and must not be reused.

## REG-077 — merged-main handoff must diff the immutable pre-push base

**Defect:** After the S6 implementation merged to `main`, the complete merged-main engineering gate passed, but the generated manual-test handoff incorrectly said `NO MANUAL FEATURE TEST REQUIRED`, reported zero changed files, and omitted the mandatory `/worker/identity` owner/browser test.

**Observed evidence:**

- S6 exact implementation head `c5f9578c88e656f662399ccf6f024bff4f975d58` correctly generated the Worker Identity manual handoff.
- implementation merge `361d96884e115be88c439cbe78fe4540b5ae7082` passed merged-main run `31440966329`;
- that merged-main artifact reported `Changed files examined: 0` even though the merge contained the S6 Worker Identity UI changes.

**Root cause:** `report-manual-handoff.mjs` supports an explicit `HANDOFF_BASE_REF`, but CI did not provide one. On a push build of `main`, `actions/checkout` resolves `origin/main` to the same commit as `HEAD`. The fallback `origin/main...HEAD` diff is therefore empty, so visible product changes disappear from the handoff classification even though the release commit changed them.

**Root fix:** The engineering workflow now supplies an immutable event-derived handoff base before the full gate runs:

- pull request: `github.event.pull_request.base.sha`;
- push to `main`: `github.event.before`;
- manual dispatch fallback: `HEAD^`.

The existing report generator consumes `HANDOFF_BASE_REF` first, so both branch and merged-main reports classify the actual change set instead of the mutable checked-out branch pointer.

**Permanent guard:** `tests/engineering/handoff-domain.test.mjs` asserts that the workflow retains the PR base SHA, push `before` SHA, manual-dispatch fallback, and that the report consumes `HANDOFF_BASE_REF`. The full engineering gate executes this test through `test:engineering`.

**Expected behaviour:** A merged-main release that contains browser-visible changes must preserve those changes in the generated handoff and may never downgrade a required owner/browser test merely because `origin/main` already points at `HEAD`.

**Status:** PROTECTED.

## REG-078 — submission readiness must be server-owned and actionable

**Defect:** During S6 owner/browser acceptance, an otherwise valid draft with all three visible evidence bindings but an incomplete required personal field was rejected by the database submission trigger. The Worker received only the generic unknown-failure message, so the real readiness condition was hidden.

**Root cause:** The SQL trigger correctly owned the final invariant, but the application had no server-authoritative readiness projection before calling the lifecycle transition. Expected `23514` business rejection therefore escaped the application contract and collapsed into the generic catch-all error.

**Root fix:** Initial and correction submission services now use one shared Worker-only readiness service before the repository transition. It revalidates the live Worker session and current lock version, then derives required personal fields, current verified account-contact binding, and all three current available evidence requirements from trusted database state. It throws a bounded `WorkerIdentityContractError` subtype with only safe requirement labels. The existing SQL submission trigger remains unchanged as defense in depth.

**Permanent guard:** `worker-identity-submission-readiness.test.mjs` reproduces the owner state with the exact populated values and a blank country of residence, proves the only missing requirement is `country_of_residence`, proves the safe message names Country of residence, then completes the field and proves readiness passes. The S6 runtime runner executes this regression permanently.

**Expected behaviour:** A predictable incomplete/stale submission must explain the safe requirement that blocks submission; it must never expose SQL/storage internals or downgrade the database invariant.

**Status:** PROTECTED.

## REG-079 — React Server Action forms must own method and encoding metadata

**Defect:** The Worker Identity evidence form emitted the React console error `Cannot specify a encType or method for a form that specifies a function as the action` during owner/browser acceptance.

**Root cause:** `EvidenceUploadCard` used a function-valued React Server Action while also explicitly setting `encType="multipart/form-data"`. React owns the method and encoding for function actions and overrides explicit transport metadata.

**Root fix:** The evidence form remains a function-valued Server Action form, but explicit `encType`/`method` metadata is removed. Upload quarantine, structural validation, malware scanning and evidence binding are unchanged.

**Permanent guard:** The S6 runtime runner fails if the Worker Identity workspace reintroduces any explicit `encType=` or `method=` attribute. The normal project typecheck/build remains authoritative for React/Next integration.

**Expected behaviour:** Evidence upload/replacement produces no Server Action form transport warning, while file uploads continue through the existing secure server action pipeline.

**Status:** PROTECTED.
