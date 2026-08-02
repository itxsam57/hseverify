# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current owner gate

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IMPLEMENTED, OWNER RETEST REQUIRED**

Pull request #8 established the shared design system, responsive Worker shell, keyboard/focus contracts, accessible table and dialog primitives, and live adoption across Worker routes. It was squash-merged as `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767`.

Windows owner testing has found four release-blocking engineering defects:

1. `LATER-OWNER-003` — portable preview copying attempted to recreate a traced PGlite symbolic link and failed with `EPERM`.
2. `LATER-OWNER-004` — the protected runtime smoke wrote partial development types into the same `.next` directory later consumed by production build.
3. `LATER-OWNER-005` — passing automated Next commands left tracked `next-env.d.ts` and `tsconfig.json` modified.
4. `LATER-OWNER-006` — after PR #11, the ordinary `npm run dev` path still invoked raw `next dev` and rewrote tracked root `tsconfig.json`, including changing `jsx` from `preserve` to `react-jsx`.

PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and rewrote preview copying to materialize traced packages as ordinary files, verify a link-free PGlite bundle, clean partial bundles, check `/` and `/worker/login`, and prove server shutdown.

PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated the protected runtime smoke from production output.

PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced the automated type-generation, runtime-smoke and production-build configuration system. It stopped tracking `next-env.d.ts`, added ignored generated mode configs, isolated automated outputs and hashed protected source configuration around automated Next commands.

## Owner defect LATER-OWNER-006

During the next Windows owner retest on Node.js `v22.23.1`, the owner started the ordinary application with:

```cmd
npm run dev
```

After opening Worker routes, stopping the server and running:

```cmd
git diff -- tsconfig.json package.json package-lock.json next.config.ts
```

Git reported that `tsconfig.json` had been reformatted and changed from:

```text
"jsx": "preserve"
```

to:

```text
"jsx": "react-jsx"
```

The root cause was exact and separate from the PR #11 automated-mode rewrite: `package.json` still mapped `npm run dev` directly to raw `next dev`. The default Next command mode therefore continued using the tracked root `tsconfig.json`.

## Pull request #12 — ordinary development boundary

PR #12 corrects the missing normal-development path by:

- replacing raw `next dev` with `scripts/run-development.mjs`;
- assigning ordinary development to `.next-development`;
- generating `.hse-next/development/tsconfig.json` for the Next dev server;
- giving development, typecheck, runtime smoke and production build separate generated-config subdirectories;
- excluding only other modes from each generated TypeScript config, never excluding the mode’s own route types;
- hashing `package.json`, `package-lock.json`, `next.config.ts` and `tsconfig.json` before development startup and after Ctrl+C shutdown;
- failing the development command if protected source changes;
- terminating the Windows development process tree;
- cleaning `.next-development` and its generated config on success, Ctrl+C and failure;
- adding an automated real development-server smoke to the permanent `npm run check` chain;
- requiring `/worker/login` HTTP 200, clean shutdown and unchanged protected configuration;
- extending the architecture regression so raw `next dev` cannot silently return.

The first PR #12 technical run passed the real normal-development smoke, protected runtime, production build, portable preview and artifact upload. Documentation and final exact-head validation remain part of the PR gate before merge.

## Mandatory focused retest after PR #12 merge

Follow:

- `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md`

The focused Windows retest must prove:

- the failed local `tsconfig.json` change is restored before pulling;
- `npm run dev` resolves to `node scripts/run-development.mjs`;
- automated and manual normal development use `.next-development` and an ignored generated config;
- Worker Login, Dashboard and Profile load;
- Ctrl+C stops the complete process tree;
- `git status --short` and the protected-file diff remain empty;
- `.next-development` and `.hse-next/development` are removed after shutdown;
- the full `npm run check` gate passes afterward;
- no Administrator terminal or Developer Mode is required.

After this focused retest passes, resume the remaining portable preview and browser/accessibility acceptance in the existing M1.02 guides.

M1.02 must not receive DONE until the owner reports **Overall: PASS**. `LATER-OWNER-003` through `LATER-OWNER-006` remain implementation-fixed but owner-retest pending. Any new failure must be recorded as a new owner defect, repaired and retested.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
