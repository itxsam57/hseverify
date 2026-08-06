# LATER-OWNER-016 — Company tenant-scope delete confirmation

## Status

Repair implemented on `fix/m1-04-delete-confirmation`; automated and owner retest pending.

## Owner-observed failure

On the M1.04 Company tenant-scope demonstration, the visible **Delete** control did not complete the destructive workflow for the selected synthetic record.

## Root cause

`RecordEditor` renders the update workflow inside a form. The shared `ConfirmDialog` previously rendered its own server-action form inside the caller's form. Nested forms are invalid HTML and allow the browser to ignore the destructive form boundary or submit the surrounding edit form instead.

## Repair boundary

- Render the confirmation dialog and its action form through a React portal attached to `document.body`.
- Keep the Delete trigger as `type="button"` so opening the dialog never submits the edit form.
- Keep Cancel explicitly non-submitting.
- Add a pending state (`Deleting…`) and disable repeat confirmation while the server action is running.
- Preserve the existing tenant-scoped delete service, non-enumerating result, route revalidation and redirect.
- Add a permanent source contract and regression-register entry.

## Required owner retest

1. Open Delete and confirm the dialog appears.
2. Cancel and confirm the record remains.
3. Reopen and confirm deletion once.
4. Confirm `Deleting…` appears, duplicate submission is blocked, the selected record disappears, the visible count decreases, and the success message appears.

M1.04 subunit 4 and subunit 5 remain blocked until the repair passes the complete engineering gate, merged-main verification and owner retest.
