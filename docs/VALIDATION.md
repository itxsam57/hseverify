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

The first CI attempt failed before validation because `@next/env` is exposed to native ESM through a CommonJS default export rather than the attempted named export. The import boundary was corrected; no validation rule was removed or weakened.

The next complete run passed:

1. locked dependency installation;
2. development/test/preview/production environment validation;
3. Worker route, role-isolation, database and migration architecture validation;
4. Worker Profile domain tests;
5. platform tests covering environment rejection, migration checksum/idempotency, SQL optimistic concurrency and guarded rollback/reapply;
6. strict TypeScript;
7. ESLint;
8. standalone Next.js production build;
9. independent startup smoke testing of `/` and `/worker/login`;
10. release-manifest generation;
11. GitHub Actions artifact creation.

Artifact review then found that GitHub Actions excludes hidden files unless explicitly enabled. The smoke-tested `.preview-bundle` therefore was not included in the first uploaded archive even though the manifest and migrations were present. The upload configuration was corrected with `include-hidden-files: true` for both preview and rollback-candidate workflows. A final complete run and artifact-size/content review are required before merge.

## Current acceptance boundary

M1.01 must not receive roadmap ✅ merely because automated validation passes. After merge, the owner must complete `docs/testing/M1_01_PLATFORM_FOUNDATION_HARD_TEST.md`.

The current implementation does not claim completion of M1.02 design-system work, production authentication and OTP, tenant authorization, audit/outbox delivery, secure evidence uploads, Worker Identity review, live hosting credentials or later milestones.
