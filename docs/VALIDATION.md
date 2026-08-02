# Validation Record

## Repository access

- Confirmed live GitHub read and write access.
- Temporary write-enabled workflows are removed before merge.
- Permanent validation and rollback workflows use read-only repository permission.

## Worker Dashboard foundation

The Worker Dashboard foundation passed locked dependency installation, Worker route and role-isolation validation, strict TypeScript, ESLint and a Next.js production build.

## Worker Profile and onboarding continuation

Pull request #3 passed:

1. Worker route, role-isolation and profile-persistence manifest validation;
2. five Worker Profile domain tests;
3. strict TypeScript;
4. ESLint;
5. Next.js production build.

The owner reported the Worker Dashboard and Worker Profile hard test as **PASS on 2 August 2026**.

## M1.01 platform foundation

Pull request #5 introduced validated runtime environments, PostgreSQL-compatible persistence, migrations, preview artifacts and rollback-candidate tooling.

### Defects corrected before the original merge

1. `@next/env` native ESM/CommonJS interop was corrected without weakening validation.
2. Hidden standalone bundle files omitted by the first artifact upload were corrected with hidden-file inclusion.

The original exact-head workflow passed environment, migration, profile, concurrency, rollback, TypeScript, ESLint, production-build, standalone-startup and artifact checks.

## M1.01 owner defect LATER-OWNER-001

The first Windows owner test found that migrations opened the PGlite database but the Next.js/Turbopack application failed on the protected Dashboard path with a path/URL TypeError wrapped as `ProfileStorageConfigurationError`. The normal error boundary also mounted nested document elements.

Pull request #6:

1. normalized PGlite storage to a native filesystem string;
2. aligned migration and application database opening;
3. created missing parent directories without resetting data;
4. externalized PGlite from the Next.js server bundle;
5. corrected root-segment and global error boundaries;
6. added Windows-path and existing-database protected-route regressions.

The final PR #6 exact-head workflow passed all platform, runtime, build, preview and artifact stages.

### Owner functional retest result

On 2 August 2026 the owner completed the repaired process on Windows, loaded the Worker Profile, filled the full form and successfully saved it. No repeated path, `ProfileStorageConfigurationError`, white-screen or nested-document failure was reported. `LATER-OWNER-001` is resolved.

## M1.01 visible controls and dependency security

The same owner pass found invisible Profile control boundaries and three high-severity production-path transitive findings.

Pull request #7:

- added visible input, date, number, select, textarea, checkbox, focus, disabled and validation states;
- pinned PostCSS `8.5.18` and Sharp `0.35.3` through explicit compatibility overrides;
- added deterministic security-floor checks;
- added `npm audit --omit=dev --audit-level=high` to the trusted gate;
- retained override removal as `LATER-044`.

The exact-head gate reported `found 0 vulnerabilities`, passed Profile/platform/runtime/build/preview checks and uploaded the complete artifact. The owner then reported the final UI/security retest as PASS. M1.01 is **DONE**.

## M1.02 design system and global UX

Pull request #8 introduced:

- semantic design tokens for colour, spacing, radius, shadow, control height, touch target, focus, motion and z-index;
- shared buttons, fields, inputs, selects, textareas, checkboxes, alerts, badges, cards, empty states and loading states;
- semantic table primitives with caption, column scopes and a keyboard-focusable narrow-screen region;
- a native labelled confirmation dialog calling the real sign-out server action;
- mobile Worker navigation below the desktop sidebar breakpoint;
- high-contrast, forced-colour and reduced-motion CSS contracts;
- live adoption in Worker login, Worker statuses, Profile history and sign-out;
- removal of the duplicate legacy Worker Profile stylesheet;
- permanent `check:design-system` validation inside `npm run check`.

### PR #8 exact-head CI result

Pull-request merge head `0e40d7e9acdca69fe17401349dd03648f3c8190e` passed the locked install, design-system, Profile, platform, runtime, build, Linux preview and artifact gates. The artifact contained 1,630 files and was 20,139,032 bytes with SHA-256:

```text
347ec1edc7966fb4c3d3c5c51551753359d28c4399262ed81bb6ef4e6c23e0b4
```

## M1.02 owner defect LATER-OWNER-003

The owner tested commit `ebb06e4` on Windows with Node.js `v22.23.1`. Installation, the full application gate and production build passed, but `npm run preview:smoke` failed before standalone startup because the default recursive copy preserved a traced PGlite package link and Windows rejected the destination symbolic link with:

```text
EPERM: operation not permitted, symlink
```

Administrator Command Prompt produced the same result.

### PR #9 repair

Pull request #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and:

1. added the shared portable bundle builder;
2. dereferenced traced package links into ordinary destination files/directories;
3. cleaned incomplete bundles before and after failed attempts;
4. verified `server.js`, static assets, PGlite inclusion and the absence of symbolic links;
5. retained real `/` and `/worker/login` standalone checks;
6. waited for preview server shutdown;
7. added the portable copy/repeatability regression to `npm run check`.

The exact-head repair gate passed portable bundle creation, route responses, process shutdown and a complete artifact upload. Windows owner confirmation remained open.

## M1.02 owner defect LATER-OWNER-004

During the focused Windows retest, the owner ran `npm run check` using Node.js `v22.23.1`.

The following passed:

- environment validation;
- Worker route and role-isolation checks;
- design-system and Profile UX checks;
- secure dependency floors;
- production audit with `found 0 vulnerabilities`;
- five Profile tests;
- five platform/migration/concurrency/rollback tests;
- portable preview-copy regression;
- standalone TypeScript;
- ESLint;
- protected existing-database PGlite runtime smoke.

The final production build then failed at:

```text
.next/dev/types/validator.ts:89:1
Type error: Cannot find name 'er'.
er = {} as typeof import(...)
```

Standalone TypeScript had already passed before `test:runtime-db`. The invalid file was therefore produced after that stage when the runtime smoke launched `next dev` in the shared `.next` directory later consumed by `next build`.

### PR #10 repair

Pull request #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and:

1. adds a validated internal `HSE_NEXT_DIST_DIR` option to Next configuration;
2. runs the protected runtime smoke in `.next-runtime-smoke` rather than production `.next`;
3. uses Windows process-tree termination for the runtime-smoke server;
4. removes the isolated directory with retry-safe cleanup;
5. removes stale `.next/dev` and isolated smoke output before standalone typecheck;
6. wraps production build startup to clean development output and force the standard `.next` production directory;
7. adds an exact malformed-validator regression that proves development output is removed while `.next/types` production output is retained;
8. commits the expected `.next/dev/types/**/*.ts` include so Next.js does not silently modify `tsconfig.json` during build;
9. adds the output-boundary regression to the permanent `npm run check` chain.

### Final PR #10 exact-head validation

Source head `4adca589afeaa56af92850fecb120027168a9f02` / pull-request merge head `f90058373864a78e1dfe352395125dfc2c0dbafb` passed:

1. locked dependency installation;
2. all environment, route, design-system, UX and dependency checks;
3. production audit with zero vulnerabilities;
4. five Profile tests and five platform tests;
5. portable preview-copy regression;
6. generated-output boundary regression using the exact malformed `er = ...` file;
7. cleanup before standalone typecheck;
8. strict TypeScript and ESLint;
9. protected PGlite runtime smoke with isolated Next development output;
10. production build after the runtime smoke;
11. no automatic `tsconfig.json` rewrite;
12. portable PGlite preview bundle verification;
13. standalone `/` and `/worker/login` responses with HTTP 200;
14. preview server shutdown;
15. release manifest generation;
16. complete 1,630-file artifact upload.

The artifact was 20,139,145 bytes with SHA-256:

```text
9ae7f34b5d90483df624fa74c8de01e5bcf348b227e3bc4c8a58bb1ccd36e9ce
```

## Current acceptance boundary

M1.02 is **IMPLEMENTED — OWNER RETEST REQUIRED**.

The owner must now complete:

- `docs/testing/M1_02_RUNTIME_BUILD_RETEST.md`;
- the resumed Windows portable preview checks;
- any remaining browser sections in `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`.

M1.03 remains blocked. This implementation does not claim production authentication and OTP, tenant authorization, immutable audit/outbox delivery, secure evidence uploads, Worker Identity review or live hosting credentials.
