# Next Build Unit

## Previous accepted owner gate

**Worker Dashboard and Worker Profile: PASSED — 2 August 2026**

No owner defect was reported for that earlier vertical-slice gate.

## Current owner gate

**M1.01 — IMPLEMENTED, OWNER RETEST REQUIRED**

The initial M1.01 owner hard test found release-blocking defect `LATER-OWNER-001` on Windows:

- the migration CLI opened the configured PGlite database successfully;
- the Next.js/Turbopack application failed when opening the same database through `/worker/dashboard`;
- the protected route rendered **Temporary problem** with a path/URL TypeError wrapped as `ProfileStorageConfigurationError`;
- the normal root error boundary mounted nested `<html>` and `<body>` elements.

Pull request #6 repairs the application runtime by:

- normalizing PGlite storage to a native filesystem path string;
- sharing path resolution between migration and application runtimes;
- keeping PGlite external to the Next.js server bundle;
- creating missing parent directories without deleting or replacing the configured database;
- rejecting URL objects at the path boundary;
- correcting the root-segment and global error boundaries;
- adding Windows path tests;
- adding a real protected Dashboard/Profile application-runtime regression using an existing migrated filesystem database and no-reset verification.

## Mandatory retest

Do not begin M1.02 after CI alone.

After the repair is merged, the owner must follow:

- `docs/testing/M1_01_WINDOWS_PGLITE_RETEST.md`

The retest must preserve `.data/postgres-owner-test`, prove the existing migrated database opens through the actual Worker Dashboard and Profile, prove saves survive refresh and server restart, and confirm that no path error, `ProfileStorageConfigurationError`, nested document error, database reset or silent fallback occurs.

Any new failure must be recorded in `docs/bookmarks/LATER.md` as an owner defect, fixed and retested.

## Next allowed brick after M1.01 acceptance

**M1.02 — Design system and global UX contract**

M1.02 remains blocked until the focused Windows PGlite owner retest reports **Overall: PASS** and M1.01 is marked DONE in the Milestone Path.

After M1.02 passes its own owner test, continue in canonical order:

1. M1.03 — production authentication, mandatory email and phone OTP, recovery and role-specific portal isolation.
2. M1.04 — authorization and tenant isolation.
3. M1.05 — immutable audit/outbox and persisted notifications.
4. M1.06 — secure private upload pipeline.
5. Resume M1.07 — Worker Identity Engine.
