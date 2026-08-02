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

On 2 August 2026 the owner reported completing the repaired process on Windows, loading the Worker Profile, filling the full form and successfully saving it. No repeated path, `ProfileStorageConfigurationError`, white-screen or nested-document failure was reported. `LATER-OWNER-001` is resolved.

## M1.01 follow-up findings from the successful owner retest

### LATER-OWNER-002 — invisible Worker Profile controls

The profile workflow functioned and saved, but editable fields had no clear boxes and visually blended into the page.

Pull request #7 adds:

- visible input, date, number, select and textarea boundaries;
- hover and keyboard-focus feedback;
- disabled, placeholder and validation-error states;
- checkbox and form-action styling;
- responsive profile layouts;
- a permanent `check:ux` architecture regression.

### Production dependency audit findings

`npm ci` completed successfully but npm reported three high-severity production-path transitive findings through Next.js:

- PostCSS advisories affecting the locked version below `8.5.18`;
- Sharp/libvips advisories affecting Sharp below `0.35.0`.

The npm force suggestion would have downgraded Next.js to an incompatible old version, so it was rejected.

Pull request #7 instead:

1. explicitly overrides PostCSS to `8.5.18`;
2. explicitly overrides Sharp to `0.35.3`;
3. regenerates the exact lockfile;
4. verifies minimum secure versions deterministically from `package-lock.json`;
5. runs the production dependency audit inside `npm run check`;
6. tracks override removal in `LATER-044` so it cannot disappear before a compatible patched Next.js dependency tree is proven.

## Current acceptance boundary

M1.01 is **implemented with final UI/security owner retest required**. It must not receive roadmap ✅ until the owner passes:

- `docs/testing/M1_01_PROFILE_UI_SECURITY_RETEST.md`

The remaining proof is visible form controls and focus/error states on the owner’s Windows browser, zero high production audit findings, full `npm run check`, and unchanged save/refresh/server-restart persistence.

M1.02 remains blocked. The implementation does not claim completion of production authentication and OTP, tenant authorization, audit/outbox delivery, secure evidence uploads, Worker Identity review, live hosting credentials or later milestones.
