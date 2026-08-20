# PRE-M2.06 Audit Rejection 2 — Worker Profile / Identity Persistence and Feedback

**Audit:** PRE-M2.06-AUDIT  
**Affected bricks:** M1.02 shared UX/feedback, M1.07 Worker onboarding and Identity Engine  
**Classification:** `UX_STATE_DEFECT` with one `EDITING_DEFECT` and one `BROWSER_HARNESS_DEFECT` during repair  
**Status:** FIXED_AND_BROWSER_REPROVEN

## Purpose under audit

A signed-in Worker must be able to save Profile and Identity data through visible server-authoritative forms, perceive success/error feedback, navigate away and back, hard reload, and retain the committed values without stale-tab overwrite risk.

## Browser RED 1 — persistence succeeded but success feedback disappeared

The retrospective real-Chromium flow successfully:

- registered and activated a new Worker;
- signed in;
- saved Profile personal details;
- hard reloaded and confirmed Profile values persisted;
- submitted Identity details through the real form.

The Identity POST returned HTTP 200 and the entered values were persisted, but the required `role=status` success message `Identity details saved.` never remained visible to the Worker. This violates the shared UX rule that actions must produce perceivable success/error feedback.

### Root cause

`IdentityDetailsForm` used a generic `useRefreshOnResult(state)` hook which refreshed the route after successful `useActionState` completion. The Identity save server action also called `revalidatePath()`. That combination remounted/replaced the client form state before the returned action-state announcement could reliably remain perceivable.

Simply suppressing the client success refresh was insufficient because the save path still needed to advance the optimistic-concurrency `draft_revision` token for a second safe save.

## Root correction

The save-draft path was separated from lifecycle-changing Identity actions:

- `src/lib/identity/worker-identity-draft-save-state.ts` carries a small client-safe action state including the newly persisted `draftRevision`.
- `src/app/worker/(portal)/identity/save-draft-action.ts` saves through the existing server-authoritative `WorkerIdentityDraftService` and returns the actual new revision.
- `IdentityDetailsForm` uses that returned revision immediately for the hidden `expectedDraftRevision`/`hasDraft` values, preserving optimistic concurrency without forcing a whole-page success refresh.
- conflict results still trigger authoritative refresh.
- lifecycle transitions/uploads continue to use their existing revalidation behavior.

## Repair-cycle editing defect caught by Chromium

The first dedicated action module was marked `"use server"` but also exported the initial state object. Next.js correctly rejected it with:

`A "use server" file can only export async functions, found object.`

The retrospective browser caught the resulting HTTP 500 immediately. The state type/object was moved to the normal shared module and the server-action module now exports only the async action. No test was weakened.

## Browser harness defect isolated and disproven as product hydration issue

After the product assertions were passing, Chromium reported a React hydration mismatch whose rendered diff consisted only of temporary inline `caret-color: transparent` attributes. Official Playwright screenshot behavior documents that screenshots default to `caret: "hide"`; setting `caret: "initial"` preserves the page's native caret behavior.

The retrospective screenshot calls were changed to `caret: "initial"`. The hydration console error disappeared while all product assertions continued to pass, proving this specific error was introduced by the screenshot harness rather than HSE Verify rendering.

## Final browser GREEN

Phase‑1 retrospective audit run `32204781059`, job `95925765340` completed successfully on the candidate containing the repaired Identity save boundary plus the caret-neutral browser harness.

The job log records:

- `PASS Worker registration and contact verification`
- `PASS Worker profile and identity persist across navigation and reload`
- strict TypeScript PASS
- lint PASS with 0 errors (warnings are tracked separately and are not this finding)

Evidence artifact:

- artifact id `9348767253`
- digest `sha256:f0503b2c131022e31c8597b538c4aaaf7cf748a22a727e8a5312c88b03ef294d`

The Profile/Identity checkpoint proves:

1. Profile fields save through visible UI.
2. Profile success feedback is visible.
3. Profile values survive hard reload.
4. Identity fields save through visible UI.
5. Identity success feedback is visible.
6. the returned persisted draft revision becomes the next optimistic-concurrency token without a forced success refresh.
7. Identity values survive navigation away/back and hard reload.
8. no product pageerror/console-error remains in this checkpoint when the screenshot harness does not mutate caret styling.

## Gatekeeper state

This individual finding is `FIXED_AND_BROWSER_REPROVEN`. The broader PRE-M2.06 audit remains `CONTINUE`; M2.06 Task 3 production implementation stays paused until every completed M1.01–M2.05 purpose has sufficient UI/workflow/performance evidence and the audit receives Gatekeeper ACCEPT.
