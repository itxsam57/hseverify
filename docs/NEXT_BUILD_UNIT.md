# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current owner gate

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IMPLEMENTED, OWNER RETEST REQUIRED**

Pull request #8 established the shared design system, responsive Worker shell, keyboard/focus contracts, accessible table and dialog primitives, and live adoption across Worker routes. It was squash-merged as `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767`.

Windows owner testing then found three release-blocking engineering defects:

1. `LATER-OWNER-003` — portable preview copying attempted to recreate a traced PGlite symbolic link and failed with `EPERM`.
2. `LATER-OWNER-004` — the protected runtime smoke wrote partial development types into the same `.next` directory later consumed by the production build.
3. `LATER-OWNER-005` — after the repaired full gate and production build passed, `git status --short` still showed tracked `next-env.d.ts` and `tsconfig.json` modified.

PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and rewrote preview copying to materialize traced packages as ordinary files, verify a link-free PGlite bundle, clean partial bundles, check `/` and `/worker/login`, and prove server shutdown.

PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated the protected runtime smoke from production output. The owner retest proved malformed generated types were removed and production build completed, but it exposed the tracked-file mutation defect.

## Merged full subsystem rewrite — pull request #11

The owner explicitly rejected another narrow patch and required the defective section to be reread and rewritten wherever necessary.

Pull request #11 was squash-merged as:

```text
36e1cfc9c5395cffbce330c56cfbbe19fca4871a
```

It replaces the complete Next type-generation, runtime-smoke and production-build subsystem:

- `next-env.d.ts` is generated, ignored and no longer tracked;
- root TypeScript configuration uses Next-compatible stable values, including `jsx: preserve`;
- arbitrary output-directory control is removed;
- validated command modes separate normal development, route type generation, protected runtime smoke and production build;
- type generation uses `.next-typecheck`;
- protected runtime smoke uses `.next-runtime-smoke`;
- production output alone uses `.next`;
- every automated mode receives a fresh ignored TypeScript configuration under `.hse-next`;
- package, lockfile, Next configuration and root TypeScript configuration are hashed before and after every Next command;
- any protected source-configuration change fails the command;
- obsolete partial-cleanup implementations and their narrow regression are deleted;
- four permanent Next-system regressions protect repository architecture, isolated modes, mutation detection and complete cleanup;
- generated workspaces are excluded from Git and ESLint;
- the Windows runtime harness terminates the complete process tree and cleans temporary output on success or failure.

## Exact final-head evidence

Source head `c8d59a9b1ee97ec9d72f5c77484f33c4505b4527` / pull-request merge head `27a4989dc27720fe0cda5643f993ccf05ac3ac0a` passed workflow run `30743937853`, job `91486183017`:

- locked installation of 349 packages;
- environment, route, design-system and Profile UX validation;
- PostCSS `8.5.18` and Sharp `0.35.3` security floors;
- production audit with `found 0 vulnerabilities`;
- five Profile tests and five platform tests;
- portable preview-copy regression;
- four rewritten Next-system regressions, including the repository architecture guard;
- isolated `next typegen` and strict TypeScript;
- ESLint with generated workspaces excluded;
- protected existing-database PGlite runtime with unchanged source configuration;
- deterministic Next.js 16.2.12 production build after runtime smoke;
- portable PGlite preview bundle;
- standalone `/` and `/worker/login` responses with HTTP 200;
- preview server shutdown;
- release-manifest generation;
- complete 1,630-file artifact upload.

Final artifact:

- ID: `8832238865`
- size: `20,139,143` bytes
- SHA-256:

```text
a8992880f78b3171015f242f9c778ab6d96481d3ad5c606586935ba9db818228
```

## Mandatory final retest

Follow:

- `docs/testing/M1_02_FULL_REWRITE_RETEST.md`

The final Windows retest must prove from a normal Command Prompt that:

- the old tracked-file changes can be restored and the rewrite pulled cleanly;
- `next-env.d.ts` remains generated, ignored and untracked;
- `npm run typecheck`, normal `npm run dev`, `npm run check` and `npm run preview:smoke` leave tracked source configuration unchanged;
- all generated workspaces are isolated and cleaned at their lifecycle boundaries;
- the production standalone bundle contains PGlite and serves `/` plus `/worker/login`;
- repeated preview runs clean stale content, stop automatically and immediately reuse the port;
- no Administrator terminal or Developer Mode is required;
- all remaining M1.02 browser/accessibility sections pass.

M1.02 must not receive DONE until the owner reports **Overall: PASS**. `LATER-OWNER-003`, `LATER-OWNER-004` and `LATER-OWNER-005` remain implementation-fixed but owner-retest pending. Any new failure must be recorded as a new `LATER-OWNER-###`, repaired and retested.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
