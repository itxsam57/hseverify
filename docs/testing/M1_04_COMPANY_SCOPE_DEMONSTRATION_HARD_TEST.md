# M1.04 Subunit 4 — Windows Owner Hard Test

## Purpose

Confirm the visible Company-only tenant-scope demonstration works without refresh-dependent navigation and that copied-role access remains denied. Database, cross-tenant, stale-authority and concurrency behavior is automated and must not be repeated manually unless the generated handoff reports a failure.

## Preconditions

- Normal Windows Command Prompt.
- Repository: `C:\Users\arsla\hseverify`.
- Merged `main` commit supplied after CI.
- Existing synthetic local Company account with valid TOTP.
- Existing synthetic local Worker account.
- Use synthetic demonstration text only.
- The persistent local database must be migrated through the repository's latest migration before the server starts.

## Owner test A — Company protected demonstration

1. Run `npm run setup:local` and confirm environment validation and every pending migration pass.
2. Start the application with `npm run dev`.
3. Sign in at `http://localhost:3000/company/login` and complete TOTP.
4. On the Company dashboard, open **Open tenant-scope demonstration**.
5. Confirm the page shows a masked tenant reference, membership role and synthetic-data warning.
6. Confirm either the explicit empty state or only this tenant's prior neutral demonstration records.
7. Submit invalid/missing create values and confirm field errors appear while the page remains usable.
8. Create a record using a unique lowercase key and synthetic title/note.
9. Confirm it appears without manually refreshing the browser.
10. Edit it and save.
11. Confirm the updated value/version appears without manually refreshing.
12. Return to the Company dashboard, reopen the demonstration and confirm persistence.
13. Delete through the confirmation dialog and confirm the record disappears with a success message.

Expected: every operation remains inside the authenticated Company tenant; no tenant selector appears; create/update/delete do not require a manual refresh to become visible.

## Owner test B — Worker copied-route denial

1. Sign out of Company.
2. Sign in as Worker.
3. Paste `http://localhost:3000/company/tenant-scope` directly.
4. Confirm Company content never appears and the access-denied boundary is shown.
5. Return to the Worker dashboard and confirm the Worker session remains usable.
6. Sign out.

Expected: no role switch, Company data exposure or Worker-session corruption.

## Clean completion

1. Stop the server with `Ctrl+C`.
2. Confirm Command Prompt returns normally.
3. Run:

```cmd
git pull --ff-only origin main && git status --short && git diff --check && git status -sb
```

Expected:

- pull succeeds;
- `git status --short` prints nothing;
- `git diff --check` prints nothing;
- final line is `## main...origin/main`.

## Failure rule

Stop at the first failure and record:

```text
ID: LATER-OWNER-###
Area: M1.04 subunit 4
Exact route/control:
Steps to reproduce:
Expected:
Observed:
Browser/OS:
Severity:
```

Subunit 5 remains blocked until the automated gate, visible browser steps, clean shutdown and synchronized Git state all pass.
