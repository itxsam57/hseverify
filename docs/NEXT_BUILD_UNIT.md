# Next Build Unit

## Previous owner gate

**PASSED — 2 August 2026**

The owner accepted the Worker Dashboard and Worker Profile hard test. No owner defect was reported for that gate.

## Current engineering unit

**M1.01 — Repository, environments, database/migrations, preview artifact and rollback foundation**

The implementation branch must provide:

- validated development, test, preview and production configuration;
- PostgreSQL-compatible local/CI and production database adapters;
- deterministic migrations and checksums;
- database-backed Worker Profile persistence;
- legacy profile import;
- deployable standalone preview artifact;
- release manifest;
- exact-ref rollback candidate workflow;
- automated tests and CI evidence;
- owner hard-test instructions.

## Current gate after merge

Do not begin M1.02 merely because M1.01 CI passes.

The owner must test the merged M1.01 result using:

- `docs/testing/M1_01_PLATFORM_FOUNDATION_HARD_TEST.md`

Any failure must be recorded in `docs/bookmarks/LATER.md` as an owner defect, fixed and retested.

## Next allowed brick after M1.01 owner acceptance

**M1.02 — Design system and global UX contract**

M1.02 will consolidate the shared portal tokens, controls, forms, dialogs, status patterns, loading/empty/error states, responsive behavior and accessibility contract before production authentication and additional role portals are built.

After M1.02 passes its own owner test, continue in canonical order:

1. M1.03 — production authentication, mandatory email and phone OTP, recovery and role-specific portal isolation.
2. M1.04 — authorization and tenant isolation.
3. M1.05 — immutable audit/outbox and persisted notifications.
4. M1.06 — secure private upload pipeline.
5. Resume M1.07 — Worker Identity Engine.
