# HSE Verify

Clean Phase 1 rebuild of the HSE Verify Workforce Trust Platform.

## Current build unit

The repository currently contains the **Worker Dashboard foundation** only:

- Next.js App Router and strict TypeScript baseline
- role-bound worker session cookie and server-side route guard
- Worker Portal shell, responsive navigation and accessible status treatment
- server-rendered Worker Dashboard projection
- data, empty, loading and failure states
- Worker ID copy action with accessible confirmation
- notification deep links within the dashboard
- distinct **Exit portal** and **Sign out** behavior
- safe public worker projection for records explicitly marked public
- environment-gated demo authentication and demo dashboard data

No production identity provider, database or evidence store has been connected yet. The interfaces are intentionally separated so those adapters can replace the foundation implementations without rewriting the dashboard UI.

## Local setup

1. Install Node.js 20.9 or newer.
2. Copy `.env.example` to `.env.local`.
3. Set a strong `HSE_SESSION_SECRET`.
4. For local visual testing only, set both demo flags to `true` and provide demo credentials.
5. Run:

```bash
npm install
npm run dev
```

Then open `/worker/login`.

## Validation

```bash
npm run typecheck
npm run lint
npm run check:routes
npm run build
```

See `docs/WORKER_DASHBOARD_FOUNDATION.md` for architecture, boundaries and the next dashboard-by-dashboard build steps.
