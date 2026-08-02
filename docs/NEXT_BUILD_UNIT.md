# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current owner gate

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IMPLEMENTED, OWNER RETEST REQUIRED**

Pull request #8 was squash-merged as:

```text
ddd3bccc40a4176b394c138d2d12a3fdf2f3a767
```

It established the shared design system, responsive Worker shell, keyboard/focus contracts, accessible table and dialog primitives, and live adoption across Worker routes.

The first Windows owner test found `LATER-OWNER-003`: `npm run preview:smoke` attempted to recreate a traced PGlite symbolic link and failed with `EPERM`. Pull request #9 was squash-merged as:

```text
d849ec933f61c5296a3fc981ef57e470445f2ee1
```

It materializes traced packages as ordinary files, verifies a link-free PGlite bundle, cleans partial preview bundles, checks `/` and `/worker/login`, and proves preview server shutdown.

## New owner defect LATER-OWNER-004

During the focused Windows retest on Node.js `v22.23.1`, the owner ran `npm run check`.

The following passed:

- environment, route, design-system and UX checks;
- secure dependency floors and production audit;
- Profile and platform tests;
- portable preview-copy regression;
- standalone TypeScript and ESLint;
- protected existing-database PGlite runtime smoke.

The final production build then failed while type-checking a malformed generated file:

```text
.next/dev/types/validator.ts:89:1
Type error: Cannot find name 'er'.
er = {} as typeof import(...)
```

Because standalone TypeScript had already passed before `test:runtime-db`, the invalid file was produced afterward when the runtime smoke launched `next dev` in the same `.next` directory later consumed by `next build`.

Pull request #10 repairs this boundary by:

- assigning the runtime smoke its own `.next-runtime-smoke` directory;
- validating the internal Next output directory name;
- terminating the Windows runtime-smoke process tree;
- removing isolated output with retry-safe cleanup;
- cleaning stale `.next/dev` before standalone typecheck and production build;
- forcing production builds back to the standard `.next` directory;
- adding a regression with the exact malformed `er = ...` validator;
- preserving production `.next/types` while removing development output;
- committing Next.js's expected `.next/dev/types/**/*.ts` include so builds do not modify `tsconfig.json`.

The first repair gate passed the output-boundary regression, isolated PGlite runtime smoke, production build, portable preview smoke and artifact upload. Final exact-head validation and owner retest remain mandatory.

## Mandatory retest

After PR #10 is merged, follow:

- `docs/testing/M1_02_RUNTIME_BUILD_RETEST.md`

This retest deliberately recreates the malformed development validator, confirms cleanup, reruns the complete `npm run check`, confirms `.next-runtime-smoke` is removed, then resumes the Windows portable preview test and remaining browser acceptance.

M1.02 must not receive DONE until the owner reports **Overall: PASS**. Any new failure must be recorded as a new `LATER-OWNER-###`, repaired and retested.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
