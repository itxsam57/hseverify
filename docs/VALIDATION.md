# Validation Record

## Repository access and release discipline

- Confirmed live GitHub read and write access.
- Temporary write-enabled workflows are removed before merge.
- Permanent validation and rollback workflows use read-only repository permission.
- No brick receives DONE from compilation or CI alone; owner acceptance remains mandatory.

## Accepted Worker Dashboard and Profile slice

Pull request #3 passed Worker route and role-isolation validation, Profile persistence checks, five domain tests, strict TypeScript, ESLint and a production build. The owner reported the Worker Dashboard and Worker Profile hard test as **PASS on 2 August 2026**.

## M1.01 platform foundation — DONE

Pull request #5 introduced validated runtime environments, PostgreSQL-compatible persistence, migrations, preview artifacts and rollback-candidate tooling.

### LATER-OWNER-001

The first Windows owner test found that migrations opened the PGlite database but the Next.js/Turbopack application failed on a protected Dashboard path with a path/URL error wrapped as `ProfileStorageConfigurationError`. The normal error boundary also mounted nested document elements.

Pull request #6 normalized PGlite storage to a native filesystem string, aligned migration and application database opening, created missing parent directories without resetting data, externalized PGlite from the server bundle, corrected error boundaries and added Windows-path plus existing-database regressions. The owner then loaded, completed and saved the full Worker Profile on Windows. `LATER-OWNER-001` is resolved.

### LATER-OWNER-002

The same owner pass found invisible Profile control boundaries and high-severity production-path transitive dependency findings. Pull request #7 added visible controls, focus/disabled/error states, pinned PostCSS `8.5.18` and Sharp `0.35.3`, added deterministic dependency floors and required `npm audit --omit=dev --audit-level=high`. The exact-head gate and owner retest passed. M1.01 is DONE.

## M1.02 design system and global UX

Pull request #8 introduced semantic design tokens, shared controls and feedback, accessible table/dialog primitives, mobile Worker navigation, keyboard/focus/validation behavior, high-contrast/forced-colour/reduced-motion rules, live adoption across Worker routes and permanent design-system validation.

Pull-request merge head `0e40d7e9acdca69fe17401349dd03648f3c8190e` passed locked installation, design-system checks, Profile/platform/runtime tests, production build, Linux standalone preview and complete artifact upload. The artifact contained 1,630 files and had SHA-256:

```text
347ec1edc7966fb4c3d3c5c51551753359d28c4399262ed81bb6ef4e6c23e0b4
```

## LATER-OWNER-003 — Windows portable preview symlink

The owner tested commit `ebb06e4` on Windows with Node.js `v22.23.1`. Installation, the application gate and production build passed, but `npm run preview:smoke` attempted to recreate a traced PGlite symbolic link and Windows returned:

```text
EPERM: operation not permitted, symlink
```

Administrator Command Prompt produced the same failure.

Pull request #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1`. It replaced symlink-preserving preview copying with a portable builder that dereferences traced packages into ordinary files/directories, cleans partial bundles, rejects remaining symbolic links, verifies PGlite inclusion, starts the real standalone server, checks `/` and `/worker/login`, and waits for shutdown. A Windows-compatible link/junction regression was added permanently.

## LATER-OWNER-004 — runtime smoke and production output collision

During the next Windows retest, `npm run check` passed through standalone TypeScript, ESLint and the protected PGlite runtime smoke. The final production build then failed on a partially generated development validator:

```text
.next/dev/types/validator.ts:89:1
Type error: Cannot find name 'er'.
```

The ordering proved the runtime smoke had launched `next dev` in the same `.next` directory later consumed by `next build`.

Pull request #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17`. It isolated runtime output, added Windows process-tree termination, cleaned stale development types before typecheck/build, wrapped production build startup and added an exact malformed-validator regression. Its final exact-head CI passed the application gate, runtime smoke, production build, portable preview and artifact upload.

## LATER-OWNER-005 — tracked source configuration changed after a passing gate

The owner pulled PR #10, deliberately recreated the malformed validator and confirmed its recovery. The rewritten boundary regression passed. The complete `npm run check` then passed, including:

- environment and route validation;
- design-system and Profile UX checks;
- dependency security and zero-vulnerability production audit;
- five Profile tests and five platform tests;
- portable preview-copy regression;
- output-boundary regression;
- TypeScript and ESLint;
- protected existing-database PGlite runtime smoke;
- production build after the runtime smoke.

However, the required post-gate repository check reported:

```text
 M next-env.d.ts
 M tsconfig.json
```

The gate was therefore not deterministic even though compilation succeeded. Review of the complete path found four root causes:

1. root `tsconfig.json` used `jsx: react-jsx`, which Next rewrites to `jsx: preserve`;
2. custom Next output modes still pointed Next at the real root TypeScript configuration;
3. `next-env.d.ts` was ignored but remained tracked even though Next regenerates it;
4. typecheck, runtime smoke and production build used separate cleanup implementations that could drift.

## Pull request #11 — full Next validation/build subsystem rewrite

The owner explicitly rejected another narrow patch. Pull request #11 therefore replaces the complete subsystem.

### Architecture

- `next-env.d.ts` is deleted from tracked source and remains generated/ignored.
- Root `tsconfig.json` uses stable Next-compatible values, including `jsx: preserve` and consistent casing.
- Arbitrary `HSE_NEXT_DIST_DIR` control is removed.
- `HSE_NEXT_COMMAND_MODE` accepts only `default`, `typegen`, `runtime-smoke` or `production-build`.
- Isolated route type generation uses `.next-typecheck`.
- Protected runtime smoke uses `.next-runtime-smoke`.
- Production build alone uses `.next`.
- Each automated mode receives a fresh ignored TypeScript configuration under `.hse-next`.
- Package manifest, lockfile, Next configuration and root TypeScript configuration are SHA-256 hashed before and after every Next command.
- Any protected source-configuration mutation fails the command.
- Typecheck runs real `next typegen` followed by strict `tsc` against the generated mode configuration.
- The runtime harness uses the real migrated PGlite database, protected routes, persisted Worker Profile, Windows process-tree termination and complete cleanup.
- Production build removes all non-production workspaces first, runs the real Next build and verifies source configuration is unchanged.
- Generated workspaces are excluded from Git and ESLint.
- Obsolete partial-cleanup scripts and the narrow output-boundary regression are deleted.

### Permanent regressions

The new `test:next-system` suite protects four contracts:

1. generated Next files remain outside tracked source;
2. all modes use isolated generated configurations and outputs;
3. protected project-configuration mutation is detected;
4. complete cleanup removes every generated Next workspace.

The architecture test also fails if `next-env.d.ts` is re-tracked, obsolete cleanup files return, required ignore boundaries disappear, `jsx: preserve` changes, or the package scripts stop using the rewritten system.

### Exact technical gate

Final technical validation ran on source head `3378583be7e6d8e84c1f24eb3149844fa24c366b` / pull-request merge head `42497a5dda8e82457376b4a3eb4a92e669074a15`.

It passed:

1. locked installation of 349 packages;
2. environment validation;
3. Worker route and role-isolation validation;
4. shared design-system and Profile UX validation;
5. PostCSS `8.5.18` and Sharp `0.35.3` security floors;
6. production audit with `found 0 vulnerabilities`;
7. five Profile tests;
8. five platform/migration/concurrency/rollback tests;
9. portable preview-copy regression;
10. four rewritten Next-system regressions;
11. isolated `next typegen`;
12. strict TypeScript against the generated typecheck configuration;
13. ESLint with every generated workspace excluded;
14. protected existing-database PGlite runtime using isolated output;
15. verification that protected source configuration remained unchanged;
16. deterministic Next.js `16.2.12` production build after the runtime smoke;
17. portable PGlite bundle verification;
18. standalone `/` response with HTTP 200;
19. standalone `/worker/login` response with HTTP 200;
20. temporary preview-server shutdown;
21. release-manifest generation;
22. complete 1,630-file artifact upload.

The exact success messages included:

```text
Isolated Next type generation and strict TypeScript validation passed.
Application PGlite runtime smoke passed with isolated Next output and unchanged source configuration.
Deterministic Next production build passed without source configuration changes.
Preview smoke test passed: / 200, /worker/login 200.
Preview smoke server stopped.
```

The uploaded artifact was 20,139,171 bytes with artifact ID `8832136190` and SHA-256:

```text
9ea695d00f90429d829d944fff03091fdb302dbac8a65cda52202143b14f8d1c
```

## Current acceptance boundary

M1.02 is **IMPLEMENTED — OWNER RETEST REQUIRED**.

After pull request #11 is merged, the owner must complete:

- `docs/testing/M1_02_FULL_REWRITE_RETEST.md`;
- every unfinished browser/accessibility section in `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`.

The final Windows gate must leave tracked source clean after isolated type generation, normal development, the complete application gate, production build and repeated portable preview runs. It must require neither Administrator privileges nor Developer Mode.

M1.03 remains blocked. This rewrite does not claim production authentication/OTP, tenant authorization, immutable audit/outbox delivery, secure evidence uploads, Worker Identity review or live provider credentials.
