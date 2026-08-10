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
