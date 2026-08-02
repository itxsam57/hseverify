# HSE Verify

Clean Phase 1 rebuild of the HSE Verify Workforce Trust Platform.

## Current build

The repository contains:

- Worker Dashboard foundation
- role-bound Worker Portal session and route isolation
- Worker Profile and onboarding continuation
- PostgreSQL-compatible database and migration foundation
- PGlite local/CI database requiring no Docker
- PostgreSQL preview/production adapter
- database-backed Worker Profile persistence
- deterministic migrations, checksums and guarded local rollback
- standalone preview artifact and smoke test
- release evidence manifest and exact-ref rollback candidate workflow
- deterministic npm dependencies and production audit validation
- shared semantic design tokens
- reusable buttons, fields, alerts, badges, cards, empty/loading states, tables and confirmation dialog
- responsive Worker navigation below the desktop sidebar breakpoint
- keyboard, focus, validation, contrast, forced-colour and reduced-motion contracts

M1.01 is owner-accepted and DONE. M1.02 is the active owner gate. Production identity providers, tenant authorization, evidence storage and live deployment credentials are not connected yet; they remain in their canonical milestone bricks and in the Later bookmark.

## Build control bookmarks

Every feature build must update:

- `docs/bookmarks/MILESTONE_PATH.md` — canonical three-milestone path, current position, dependency order and owner gate.
- `docs/bookmarks/LATER.md` — every missing, partial, provider-blocked or deliberately deferred requirement.
- `docs/NEXT_BUILD_UNIT.md` — exact next allowed work after dependency and owner acceptance.

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Use test-only values and a session secret of at least 32 characters.
4. Keep `HSE_DATABASE_DRIVER=pglite` and `HSE_PGLITE_DATA_DIR=.data/postgres` for local work.
5. Enable the Worker demo login only for isolated local testing.
6. Run:

```bash
npm ci
npm run setup:local
npm run dev
```

Open `/worker/login`.

## Database commands

```bash
npm run db:migrate
npm run db:status
npm run db:import-profiles
```

Local destructive rollback is intentionally guarded and documented in `docs/M1_01_PLATFORM_FOUNDATION.md`.

## Validation

```bash
npm run check:design-system
npm run check
npm run preview:smoke
```

The complete gate validates environment separation, routes, the shared design-system contract, Worker Profile behavior, secure locked dependencies, production audit, platform migrations, optimistic concurrency, TypeScript, ESLint, protected PGlite runtime, production build and standalone preview startup.

## Current owner test

After M1.02 is merged, follow:

- `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`

M1.03 must not begin until that report passes or defects are recorded explicitly.

## Engineering documentation

- `docs/WORKER_DASHBOARD_FOUNDATION.md`
- `docs/WORKER_PROFILE_ONBOARDING.md`
- `docs/M1_01_PLATFORM_FOUNDATION.md`
- `docs/M1_02_DESIGN_SYSTEM.md`
- `docs/bookmarks/MILESTONE_PATH.md`
- `docs/bookmarks/LATER.md`
- `docs/testing/WORKER_DASHBOARD_PROFILE_HARD_TEST.md`
- `docs/testing/M1_01_PLATFORM_FOUNDATION_HARD_TEST.md`
- `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`
- `docs/NEXT_BUILD_UNIT.md`
