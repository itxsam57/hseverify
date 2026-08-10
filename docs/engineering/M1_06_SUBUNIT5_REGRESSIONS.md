# M1.06 Subunit 5 Regression Addendum

These stable IDs extend the HSE Verify regression register for defects discovered during the cumulative M1.06 isolation, migration, recovery and acceptance unit. They remain permanent even after M1.06 closes.

| ID | Defect prevented | Root cause | Required behaviour | Permanent automated guard | Status |
|---|---|---|---|---|---|
| REG-070 | A pull-request run is described and stored as an “exact-head gate” even though GitHub Actions actually checks out the synthetic `refs/pull/<n>/merge` commit, so the recorded SHA is not the branch head that the merge lock later verifies | `actions/checkout` used its default PR-event ref and `HSE_RELEASE_SHA`/artifact naming used `github.sha`; on `pull_request` events both values refer to GitHub's generated merge commit, not `github.event.pull_request.head.sha` | PR verification must explicitly check out the immutable pull-request head SHA and use that same SHA as the release/evidence identity. The later merged-`main` run separately proves integration with `main`. A pass must never be labelled exact-head unless the code actually executed is the branch head | `.github/workflows/worker-foundation-ci.yml` derives `VERIFIED_SHA` from `github.event.pull_request.head.sha` for PR events and `github.sha` otherwise, checks out `ref: ${{ env.VERIFIED_SHA }}`, supplies `HSE_RELEASE_SHA` from the same value and names evidence with it; `scripts/check-engineering-automation.mjs` protects those workflow markers | PROTECTED |

Additional serious defects discovered by the Subunit 5 cumulative gate must receive the next stable ID before M1.06 can close.
