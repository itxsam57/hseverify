# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current owner gate

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IMPLEMENTED, OWNER RETEST REQUIRED**

Pull request #8 established the shared design system, responsive Worker shell, keyboard/focus contracts, accessible table and dialog primitives, and live adoption across Worker routes. It was squash-merged as `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767`.

Windows owner testing found four release-blocking engineering defects:

1. `LATER-OWNER-003` — portable preview copying attempted to recreate a traced PGlite symbolic link and failed with `EPERM`.
2. `LATER-OWNER-004` — protected runtime smoke wrote partial development types into the same `.next` directory later consumed by production build.
3. `LATER-OWNER-005` — passing automated Next commands left tracked `next-env.d.ts` and `tsconfig.json` modified.
4. `LATER-OWNER-006` — after PR #11, ordinary `npm run dev` still invoked raw `next dev` and rewrote tracked root `tsconfig.json`, including changing `jsx` from `preserve` to `react-jsx`.

PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and rewrote portable preview copying.

PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated protected runtime smoke from production output.

PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced the automated type-generation, runtime-smoke and production-build configuration system.

## Merged LATER-OWNER-006 repair — pull request #12

During the Windows owner retest on Node.js `v22.23.1`, the owner started the ordinary application with `npm run dev`, opened Worker routes, stopped the server, and found tracked root `tsconfig.json` reformatted with `jsx` changed from `preserve` to `react-jsx`.

The exact root cause was that `package.json` still mapped `npm run dev` directly to raw `next dev`, leaving the ordinary developer path outside the protected command-mode system.

Pull request #12 was squash-merged as:

```text
4f04a525f39f203f6def7915647c68a6718303a8
```

It corrects the missing normal-development boundary by:

- replacing raw `next dev` with `scripts/run-development.mjs`;
- assigning ordinary development to `.next-development`;
- generating `.hse-next/development/tsconfig.json` for the Next development server;
- giving development, typecheck, runtime smoke and production build separate generated-config subdirectories;
- excluding only other modes from each generated TypeScript config, never excluding the active mode’s own route types;
- hashing `package.json`, `package-lock.json`, `next.config.ts` and `tsconfig.json` before startup and after Ctrl+C shutdown;
- failing development if protected source changes;
- terminating the complete Windows development process tree;
- cleaning `.next-development` and its generated config on success, signal and failure;
- adding a real development-server smoke to permanent `npm run check`;
- requiring `/worker/login` HTTP 200, clean shutdown and unchanged protected configuration;
- extending architecture regressions so raw `next dev` cannot silently return;
- clearing completed shutdown timers so successful tests do not keep Node alive unnecessarily.

## Exact final PR #12 evidence

Source head `bb8aad20f7dd5a20201d05deef9b735977ca0101` / pull-request merge head `ee8d11311ea7f8e22e6a0d36e64438708a44d8da` passed workflow run `30745665336`, job `91490717539`:

- locked installation of 349 packages;
- environment, route, design-system and Profile UX validation;
- PostCSS `8.5.18` and Sharp `0.35.3` security floors;
- production audit with `found 0 vulnerabilities`;
- five Profile tests and five platform tests;
- portable preview-copy regression;
- four expanded Next-system regressions;
- isolated `next typegen`, strict TypeScript and ESLint;
- real normal-development `/worker/login` response with HTTP 200;
- isolated development output and clean shutdown;
- protected source configuration unchanged after development;
- protected existing-database PGlite runtime smoke;
- deterministic Next.js `16.2.12` production build;
- portable PGlite standalone bundle;
- standalone `/` and `/worker/login` responses with HTTP 200;
- preview-server shutdown;
- release-manifest generation;
- complete 1,630-file artifact upload.

The decisive new result was:

```text
Normal development mode smoke passed with HTTP 200, isolated output, clean shutdown and unchanged source configuration.
```

Final PR #12 artifact:

- ID: `8832793543`
- size: `20,139,133` bytes
- SHA-256:

```text
e2f5ef4ca9150f385f16c165378538c06f49ac80e5219086ac8cf05338cdfbc1
```

## Mandatory focused Windows retest

Follow:

- `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md`

The focused retest must prove:

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

M1.02 must not receive DONE until the owner reports **Overall: PASS**. `LATER-OWNER-003` through `LATER-OWNER-006` remain implementation-fixed but owner-retest pending. M1.03 remains blocked.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
