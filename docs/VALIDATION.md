# Validation Record

## Repository access and release discipline

- Confirmed live GitHub read and write access.
- Permanent validation and rollback workflows use read-only repository permission.
- No brick receives DONE from compilation or CI alone; owner acceptance remains mandatory.
- Every owner-discovered defect is release-blocking until repaired, regression-tested and owner-retested.

## Accepted Worker Dashboard and Profile slice

Pull request #3 passed Worker route and role-isolation validation, Profile persistence checks, five domain tests, strict TypeScript, ESLint and a production build. The owner reported the Worker Dashboard and Worker Profile hard test as **PASS on 2 August 2026**.

## M1.01 platform foundation — DONE

Pull request #5 introduced validated runtime environments, PostgreSQL-compatible persistence, migrations, preview artifacts and rollback-candidate tooling.

### LATER-OWNER-001

The first Windows owner test found that migrations opened the PGlite database but the Next.js/Turbopack application failed on a protected Dashboard path with a path/URL error wrapped as `ProfileStorageConfigurationError`. Pull request #6 normalized PGlite storage, aligned migration and application database opening, externalized PGlite from the server bundle, corrected error boundaries and added Windows-path plus existing-database regressions. The owner then loaded, completed and saved the full Worker Profile on Windows.

### LATER-OWNER-002

The same owner pass found invisible Profile control boundaries and high-severity production-path transitive dependency findings. Pull request #7 added visible controls, focus/disabled/error states, pinned PostCSS `8.5.18` and Sharp `0.35.3`, added deterministic dependency floors and required `npm audit --omit=dev --audit-level=high`. Exact-head CI and owner retest passed. M1.01 is DONE.

## M1.02 design system and global UX

Pull request #8 introduced semantic design tokens, shared controls and feedback, accessible table/dialog primitives, mobile Worker navigation, keyboard/focus/validation behavior, high-contrast/forced-colour/reduced-motion rules, live adoption across Worker routes and permanent design-system validation.

## LATER-OWNER-003 — Windows portable preview symlink

The owner tested commit `ebb06e4` on Windows with Node.js `v22.23.1`. Installation, application validation and production build passed, but `npm run preview:smoke` attempted to recreate a traced PGlite symbolic link and Windows returned:

```text
EPERM: operation not permitted, symlink
```

Pull request #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1`. It replaced symlink-preserving preview copying with a portable builder that materializes traced packages as ordinary files/directories, cleans partial bundles, rejects remaining symbolic links, verifies PGlite inclusion, checks `/` and `/worker/login`, and waits for shutdown.

## LATER-OWNER-004 — runtime smoke and production output collision

During the next Windows retest, `npm run check` passed through standalone TypeScript, ESLint and protected PGlite runtime smoke. Production build then failed on a partially generated development validator:

```text
.next/dev/types/validator.ts:89:1
Type error: Cannot find name 'er'.
```

The ordering proved the runtime smoke had launched `next dev` in the same `.next` directory later consumed by `next build`.

Pull request #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17`. It isolated runtime output, added Windows process-tree termination, cleaned stale development types before typecheck/build and added the exact malformed-validator regression.

## LATER-OWNER-005 — automated commands changed tracked source

After PR #10, the owner deliberately recreated the malformed validator and confirmed recovery. The complete `npm run check` passed, but the required post-gate repository check reported:

```text
 M next-env.d.ts
 M tsconfig.json
```

The gate was therefore not deterministic even though compilation succeeded.

## Pull request #11 — automated Next subsystem rewrite

The owner rejected another narrow patch. PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced automated type generation, protected runtime smoke and production build configuration:

- `next-env.d.ts` became generated, ignored and untracked;
- root `tsconfig.json` used committed stable values;
- type generation used `.next-typecheck`;
- protected runtime smoke used `.next-runtime-smoke`;
- production build alone used `.next`;
- automated modes received ignored generated TypeScript configs under `.hse-next`;
- package manifest, lockfile, Next config and root TypeScript config were hashed before and after automated commands;
- protected source mutation failed the command;
- obsolete partial-cleanup code was deleted;
- four architecture/mode/mutation/cleanup regressions entered `npm run check`.

Final PR #11 source head `c8d59a9b1ee97ec9d72f5c77484f33c4505b4527` / merge head `27a4989dc27720fe0cda5643f993ccf05ac3ac0a` passed workflow run `30743937853`, job `91486183017`. The artifact contained 1,630 files, was 20,139,143 bytes and had SHA-256:

```text
a8992880f78b3171015f242f9c778ab6d96481d3ad5c606586935ba9db818228
```

## LATER-OWNER-006 — ordinary development still rewrote `tsconfig.json`

During the next Windows owner retest on Node.js `v22.23.1`, the owner started the real application with:

```cmd
npm run dev
```

After opening Worker routes, stopping the server and running:

```cmd
git diff -- tsconfig.json package.json package-lock.json next.config.ts
```

Git showed that tracked root `tsconfig.json` had been reformatted and changed from:

```text
"jsx": "preserve"
```

to:

```text
"jsx": "react-jsx"
```

The LF-to-CRLF warning was not the defect. The substantive tracked configuration mutation was the defect.

### Root cause

PR #11 protected automated typecheck, runtime smoke and production build, but `package.json` still mapped the ordinary developer command directly to:

```text
next dev
```

The default Next configuration therefore still used the tracked root `tsconfig.json`. The owner’s manual development path was outside the protected command-mode system and had no automated route/start/stop cleanliness test.

A complete re-read also found that each generated automated TypeScript config included its own route-type directory while excluding the same directory. That contradiction was corrected rather than preserved.

## Pull request #12 — protected ordinary development

PR #12 adds the missing normal-development boundary.

### Architecture

- `npm run dev` now invokes `node scripts/run-development.mjs`; raw `next dev` is prohibited by regression.
- Ordinary development output uses `.next-development`.
- Next receives `.hse-next/development/tsconfig.json`, never tracked root `tsconfig.json`.
- Development, typecheck, runtime smoke and production build use separate generated-config subdirectories.
- Generated configs exclude other mode outputs but do not exclude their own generated route types.
- `.next-development` is ignored by Git and ESLint.
- The development runner snapshots SHA-256 digests of `package.json`, `package-lock.json`, `next.config.ts` and `tsconfig.json` before startup.
- Ctrl+C initiates full process-tree shutdown on Windows.
- After shutdown, the runner verifies every protected digest is unchanged.
- `.next-development` and `.hse-next/development` are removed on success, signal and failure.
- Shutdown timeouts are cleared when the process exits, preventing completed tests from keeping Node alive unnecessarily.

### Permanent regression and real-server smoke

The Next-system architecture suite now proves:

1. `.next-development` and its generated config are ignored;
2. `npm run dev` cannot point directly to `next dev`;
3. development uses its own generated config and output;
4. a mode never excludes its own generated route types;
5. all mode workspaces are removed by full cleanup;
6. protected source mutation remains detectable.

A new `test:development` stage starts the same protected ordinary-development runner used by `npm run dev`, obtains a free port, requests the real `/worker/login` route, requires HTTP 200, shuts down, verifies protected source hashes and removes the development workspace.

The permanent `npm run check` order now includes:

```text
test:next-system
isolated typecheck
ESLint
test:development
test:runtime-db
production build
```

### First complete technical run

PR #12 source head `39ab904923c85104f8b66178685e480f64ae7a3f` / merge head `fce1496d317a08e987ab302baa27335e1576f9e8` passed workflow run `30745394622`, job `91489999436`:

1. locked installation of 349 packages;
2. environment, route, design-system and Profile UX checks;
3. PostCSS `8.5.18` and Sharp `0.35.3` security floors;
4. production audit with `found 0 vulnerabilities`;
5. five Profile tests;
6. five platform/migration/concurrency/rollback tests;
7. portable preview-copy regression;
8. four expanded Next-system regressions;
9. isolated `next typegen` and strict TypeScript;
10. ESLint;
11. real ordinary-development `/worker/login` HTTP 200;
12. isolated development output and clean shutdown;
13. protected source configuration unchanged after development;
14. protected existing-database PGlite runtime smoke;
15. deterministic Next.js `16.2.12` production build;
16. portable PGlite bundle verification;
17. standalone `/` and `/worker/login` HTTP 200;
18. preview shutdown;
19. release manifest;
20. complete 1,630-file artifact upload.

The decisive new success line was:

```text
Normal development mode smoke passed with HTTP 200, isolated output, clean shutdown and unchanged source configuration.
```

The first PR #12 artifact was 20,139,169 bytes, artifact ID `8832708446`, SHA-256:

```text
2f75576a4fd7363599b5dc5acfe973668292aa626111b0a33b8d4027e91df2ad
```

Documentation and shutdown-timer improvements require a final exact-head workflow before merge.

## Current acceptance boundary

M1.02 remains **IMPLEMENTED — OWNER RETEST REQUIRED**.

After PR #12 merges, the owner must complete:

- `docs/testing/M1_02_DEVELOPMENT_CONFIG_RETEST.md`;
- unfinished portable preview/full-rewrite sections;
- every unfinished browser/accessibility section in `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`.

The Windows gate must leave tracked source clean after automated and manual normal development, type generation, full application validation, production build and repeated portable preview. It must require neither Administrator privileges nor Developer Mode.

M1.03 remains blocked. This repair does not claim production authentication/OTP, tenant authorization, immutable audit/outbox delivery, secure evidence uploads, Worker Identity review or live provider credentials.
