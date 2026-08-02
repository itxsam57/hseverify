# Validation Record

## Repository access

- Confirmed live GitHub read and write access.
- Removed every temporary write-enabled workflow before feature merge.
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

The owner reported the Worker Dashboard and Worker Profile hard test as **PASS on 2 August 2026**. No owner defect was reported for that gate.

## M1.01 platform foundation

Pull request #5 introduced validated runtime environments, PostgreSQL-compatible persistence, migrations, preview artifacts and rollback-candidate tooling.

### Defects found and corrected before the original merge

1. The first CI attempt failed before validation because `@next/env` is exposed to native ESM through a CommonJS default export rather than the attempted named export. The import boundary was corrected; no validation rule was removed or weakened.
2. The first successful workflow produced only a 1.3 KB artifact because GitHub Actions excludes hidden files by default. The smoke-tested `.preview-bundle` was absent. Both preview and rollback uploads were corrected with `include-hidden-files: true`.

The original exact-head workflow then passed environment, migration, profile, concurrency, rollback, TypeScript, ESLint, production-build, standalone-startup and artifact checks.

## M1.01 owner defect LATER-OWNER-001

The owner’s Windows test found a release-blocking difference between the migration CLI and the real Next.js/Turbopack application runtime:

- `npm run db:migrate` passed;
- `npm run db:status` reported `0001_platform_foundation: applied`;
- a second migration reported the schema current;
- login redirected to `/worker/dashboard`;
- the application rendered **Temporary problem**;
- Node received a bundled/cross-realm URL object where its filesystem path boundary expected a native value;
- the error was wrapped as `ProfileStorageConfigurationError`;
- the normal `app/error.tsx` also mounted nested `<html>` and `<body>` elements.

### Repair in pull request #6

The repair:

1. resolves configured PGlite storage into a native filesystem path string;
2. rejects URL objects and unsupported URI schemes at the path boundary;
3. shares the same normalizer between database scripts and application runtime;
4. creates missing parent directories without deleting or replacing the configured database;
5. keeps `@electric-sql/pglite` external to the Next.js server bundle instead of transpiling it through Turbopack;
6. preserves the pinned PGlite `0.5.4` supported string constructor;
7. removes `<html>` and `<body>` from the normal root-segment `app/error.tsx`;
8. adds a proper root-layout `app/global-error.tsx`;
9. adds Windows `node:path.win32` path-normalization coverage;
10. adds a real Next development-server regression using an already-migrated filesystem database and a protected Worker session.

### CI defects found while repairing

1. The first repair attempt used a newer PGlite `NodeFS` API not exported by the pinned `0.5.4` package. The code was corrected to the supported native-string constructor rather than changing the dependency silently.
2. The new nested-path runtime regression showed that PGlite creates its leaf database directory but not missing parent directories. Shared recursive parent creation was added before opening the configured database.

### Final repair validation

The final exact-head workflow passed:

1. locked dependency installation;
2. environment validation;
3. route, role, PGlite-bundling and error-boundary architecture checks;
4. five Worker Profile domain tests;
5. five platform tests, including a Windows-native path assertion;
6. strict TypeScript;
7. ESLint;
8. the real protected application PGlite runtime smoke test;
9. Next.js 16.2.12 Turbopack production build;
10. standalone preview startup and route checks;
11. release-manifest generation;
12. complete artifact upload.

The protected runtime smoke:

- created an already-migrated filesystem database under a nested path containing spaces;
- inserted a sentinel Worker Profile;
- started the real Next development server;
- requested protected `/worker/dashboard` and `/worker/profile` with a signed Worker session;
- asserted HTTP 200, persisted profile content and absence of **Temporary problem**;
- asserted exactly one `<html>` and one `<body>` in each response;
- stopped the server;
- reopened the same database;
- proved the original record and version were unchanged, with no reset or silent fallback.

The repair artifact contains 1,585 files and is approximately 27.4 MB.

## Current acceptance boundary

M1.01 is **implemented but owner retest required**. It must not receive roadmap ✅ until the owner passes `docs/testing/M1_01_WINDOWS_PGLITE_RETEST.md` on Windows using the existing `.data/postgres-owner-test` database.

M1.02 remains blocked. The implementation does not claim completion of production authentication and OTP, tenant authorization, audit/outbox delivery, secure evidence uploads, Worker Identity review, live hosting credentials or later milestones.
