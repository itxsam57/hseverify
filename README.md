# HSE Verify

Clean Phase 1 rebuild of the HSE Verify Workforce Trust Platform.

## Current Worker Portal build

The repository currently contains:

- Worker Dashboard foundation
- role-bound Worker Portal session and route isolation
- responsive Worker Portal shell and working navigation
- versioned Worker Profile and onboarding continuation
- persisted personal, contact and professional profile sections
- optimistic concurrency protection against lost updates
- verified-detail correction requests that do not overwrite active identity data
- profile audit history containing field names rather than duplicate values
- dashboard profile completion and display name sourced from the committed profile
- data, empty, loading and recoverable failure states
- deterministic npm dependencies and CI validation

Production identity providers, the production database and evidence storage are not connected yet. The profile repository is an explicit adapter so the file-backed development implementation can be replaced without rewriting the profile workflow.

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Set a strong `HSE_SESSION_SECRET`.
4. Set `HSE_ENABLE_WORKER_DEMO_AUTH=true` and local demo credentials for isolated testing.
5. The profile store defaults to `.data/worker-profiles` in development. Set `HSE_PROFILE_STORAGE_DIR` to use another local mounted path.
6. Run:

```bash
npm ci
npm run dev
```

Then open `/worker/login`.

## Validation

```bash
npm run check
```

This runs the Worker Portal route and role-isolation manifest, Worker Profile domain tests, strict TypeScript checking, ESLint, and the Next.js production build.

See:

- `docs/WORKER_DASHBOARD_FOUNDATION.md`
- `docs/WORKER_PROFILE_ONBOARDING.md`
- `docs/NEXT_BUILD_UNIT.md`
