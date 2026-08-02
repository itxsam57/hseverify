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

Pull request #8 introduces:

- semantic design tokens for colour, spacing, radius, shadow, control height, touch target, focus, motion and z-index;
- shared buttons, fields, inputs, selects, textareas, checkboxes, alerts, badges, cards, empty states and loading states;
- semantic table primitives with caption, column scopes and a keyboard-focusable narrow-screen region;
- a native labelled confirmation dialog calling the real sign-out server action;
- mobile Worker navigation below the desktop sidebar breakpoint;
- high-contrast, forced-colour and reduced-motion CSS contracts;
- live adoption in Worker login, Worker statuses, Profile history and sign-out;
- removal of the duplicate legacy Worker Profile stylesheet;
- permanent `check:design-system` validation inside `npm run check`.

### First exact-head CI result

Pull-request merge head `0e40d7e9acdca69fe17401349dd03648f3c8190e` passed:

1. locked dependency installation;
2. environment validation;
3. Worker route and role-isolation validation;
4. shared design-system contract validation;
5. Worker Profile UX validation;
6. PostCSS and Sharp security floors;
7. production audit with `found 0 vulnerabilities`;
8. five Worker Profile domain tests;
9. five platform/migration/concurrency/rollback tests;
10. strict TypeScript;
11. ESLint;
12. protected existing-database PGlite runtime smoke;
13. Next.js 16.2.12 Turbopack production build;
14. standalone preview smoke: `/` 200 and `/worker/login` 200;
15. release-manifest generation;
16. complete artifact upload.

The artifact contained 1,630 files and was 20,139,032 bytes. Its reported SHA-256 digest was:

```text
347ec1edc7966fb4c3d3c5c51551753359d28c4399262ed81bb6ef4e6c23e0b4
```

### Current acceptance boundary

M1.02 is **IMPLEMENTED — OWNER TEST PENDING** after final exact-head CI and merge.

The owner must complete:

- `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`

The remaining proof is real Windows/browser behavior for desktop continuity, keyboard-only operation, sign-out modal, mobile navigation, form states, table scrolling, 200% zoom, reduced motion, contrast/forced colours, persistence and console/terminal cleanliness.

M1.03 remains blocked. This implementation does not claim production authentication and OTP, tenant authorization, immutable audit/outbox delivery, secure evidence uploads, Worker Identity review or live hosting credentials.
