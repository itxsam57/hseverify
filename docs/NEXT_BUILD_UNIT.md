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

The owner test passed installation, design-system checks, the complete `npm run check` chain and production build on Windows/Node.js 22.23.1. It found release-blocking defect `LATER-OWNER-003` in the standalone preview step:

- `npm run preview:smoke` failed before server startup;
- Node's default recursive copy attempted to recreate a traced PGlite symbolic link;
- Windows returned `EPERM: operation not permitted, symlink`;
- Administrator Command Prompt did not resolve it;
- the preview bundle therefore required a Windows capability that the product must not require.

Pull request #9 was squash-merged as:

```text
d849ec933f61c5296a3fc981ef57e470445f2ee1
```

It repairs the preview boundary by:

- materializing traced package links as ordinary files/directories with a dereferenced copy;
- cleaning incomplete `.preview-bundle` directories before every build and after failures;
- verifying no symbolic links remain in the bundle;
- verifying the traced `@electric-sql/pglite` package is included;
- retaining real standalone startup plus `/` and `/worker/login` checks;
- proving the temporary server exits;
- adding a portable-copy regression to `npm run check`.

The final exact-head gate passed the portable-copy regression, full platform checks, production build, portable bundle verification, `/` and `/worker/login` route smoke, server shutdown, release manifest and complete artifact upload.

## Mandatory retest

Follow:

- `docs/testing/M1_02_WINDOWS_PREVIEW_RETEST.md`

M1.02 must not receive DONE until the owner runs `npm run preview:smoke` from a normal Windows Command Prompt without Administrator privileges or Developer Mode and reports **Overall: PASS**. Any new failure must be added to `docs/bookmarks/LATER.md` as a new `LATER-OWNER-###` entry, repaired and retested.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
