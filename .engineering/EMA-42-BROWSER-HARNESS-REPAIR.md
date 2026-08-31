# EMA-42 — Company Team browser-harness locator repair

## RED evidence

Phase 1 retrospective browser run `33331637026` on PR #86 reached Company Team after Company verification passed, then timed out waiting for a `p` element containing `Local test invitation path:`.

The retained failure screenshot proves the product action succeeded: the invitation success state, `/staff/invite/...` path, pending invitation history, viewer role, Site scope and Department scope were all rendered.

## Root cause

`CompanyTeamWorkspace` renders the invitation path through the shared `Alert` component. `Alert` is a semantic `<div role="status">`, not a `<p>`. The retrospective harness selector was stale.

## Minimal repair

Commit `249074481476c8cf527e7c3253d529497b8bf6a5` changes only the test locator from the obsolete `p` selector to the semantic `status` role. No Company Team production behavior was changed.

## Verification requirement

Do not accept this repair from source inspection alone. A fresh clean-database Chromium run must pass Company registration, evidence upload, Admin review/activation, Company organization/team, Worker linking and the later M2.01 checkpoint before EMA-42 can close.
