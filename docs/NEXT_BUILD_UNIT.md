# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current owner gate

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IMPLEMENTED, OWNER RETEST REQUIRED**

Pull request #8 established the shared design system, responsive Worker shell, keyboard/focus contracts, accessible table and dialog primitives, and live adoption across Worker routes. It was squash-merged as `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767`.

Windows owner testing has found five release-blocking engineering defects:

1. `LATER-OWNER-003` — portable preview copying attempted to recreate a traced PGlite symbolic link and failed with `EPERM`.
2. `LATER-OWNER-004` — protected runtime smoke wrote partial development types into the same `.next` directory later consumed by production build.
3. `LATER-OWNER-005` — passing automated Next commands left tracked `next-env.d.ts` and `tsconfig.json` modified.
4. `LATER-OWNER-006` — after PR #11, ordinary `npm run dev` still invoked raw `next dev` and rewrote tracked root `tsconfig.json`, including changing `jsx` from `preserve` to `react-jsx`.
5. `LATER-OWNER-007` — Worker Profile created page-wide horizontal overflow at normal desktop width, clipping Ready to submit and Submit profile and allowing the entire shell/sidebar to move horizontally.

PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and rewrote portable preview copying.

PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated protected runtime smoke from production output.

PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced the automated type-generation, runtime-smoke and production-build configuration system.

PR #12 was squash-merged as `4f04a525f39f203f6def7915647c68a6718303a8` and added the missing protected ordinary-development path, real development HTTP smoke and post-Ctrl+C configuration verification.

## Merged LATER-OWNER-007 repair — pull request #13

The owner tested commit `362793d` on Windows 10, Node.js `v22.23.1` and Google Chrome at normal desktop width and 100% zoom.

At:

```text
http://localhost:3000/worker/profile
```

the complete Worker Portal became wider than the browser viewport. The page gained a horizontal scrollbar, scrolling right moved the sidebar and application shell off screen, the Ready to submit panel was clipped and the Submit profile button was partly outside the visible viewport.

The defect remained after `Ctrl+0` and `Ctrl+F5`, proving it was a real layout-width failure rather than browser zoom or stale cache.

Pull request #13 was squash-merged as:

```text
612e8948c24bb007e0dfc6f266b0c81a50a7408a
```

The repair replaces the defective width model:

- adds a dedicated shell-containment stylesheet loaded before Profile styles;
- guarantees `width: 100%`, `min-width: 0` and `max-width: 100%` through portal shell, main column, header, content and child boundaries;
- preserves the 260px desktop sidebar without allowing it to enlarge the document;
- makes the Profile page a named inline-size container;
- changes the Profile editor/action layout to `minmax(0, 1fr) minmax(16rem, 22rem)`;
- removes the fixed 300px right-column minimum;
- stacks summary, editor/action layout and aside at a 62rem Profile-container threshold;
- stacks steps, facts, fields and action controls at a 46rem Profile-container threshold;
- bounds form fields, status content, action descendants, Ready to submit and Submit profile to their cards;
- makes the Profile history table wrapper the only horizontal scroll region;
- contains table overscroll so it cannot move the shell or page;
- prevents intrinsic table width from propagating into the document;
- retains viewport media-query fallbacks;
- does not hide page-wide overflow on `body` or the complete portal shell.

## Permanent overflow regression

PR #13 adds `test:profile-overflow` to `npm run check`.

The suite permanently verifies:

1. shell and Profile shrink containment through every layout boundary;
2. Profile history owns the only horizontal scroll region;
3. Profile action controls remain bounded by their cards;
4. normal desktop, 860px, 768px, 390px, 320px and 125%/150%/200% zoom switch layout before clipping.

## Exact final PR #13 evidence

Source head `ae04939a683115854fe2d86c3f0c1b3852d5b9c8` / pull-request merge head `48306883c7678c3fc285f41524d230c1768a25e8` passed workflow run `30747402404`, job `91495239816`:

- locked installation of 349 packages;
- environment, route, design-system and enhanced Profile UX validation;
- production audit with `found 0 vulnerabilities`;
- five Profile tests and five platform tests;
- four Profile overflow contracts with zero failures;
- portable preview-copy regression;
- four Next-system regressions;
- isolated route type generation, strict TypeScript and ESLint;
- real normal-development HTTP 200, isolated output and clean shutdown;
- protected existing-database PGlite runtime smoke;
- deterministic Next.js `16.2.12` production build;
- portable PGlite standalone bundle;
- standalone `/` and `/worker/login` responses with HTTP 200;
- preview-server shutdown;
- release-manifest generation;
- complete 1,630-file artifact upload.

The decisive results were:

```text
Worker Profile fields, container reflow, shell shrink containment, bounded actions and table-only horizontal scrolling passed.
```

```text
✔ Worker shell and Profile keep shrink containment through every layout boundary
✔ Profile history owns the only horizontal scroll region
✔ Profile action controls remain bounded by their cards
✔ required desktop, tablet, mobile and zoom widths switch before clipping
```

Final PR #13 artifact:

- ID: `8833324966`
- size: `20,139,526` bytes
- SHA-256:

```text
cf3f5f719e8cb380bcfba959402a1b584a55337672a1e14a96130b80e9e73d5f
```

## Mandatory focused Windows retest

Follow:

- `docs/testing/M1_02_PROFILE_OVERFLOW_RETEST.md`

The retest must prove:

- no page-wide horizontal scrollbar at normal desktop, 860px, 768px, 390px or 320px;
- no page-wide horizontal scrollbar at 125%, 150% or 200% browser zoom;
- desktop sidebar remains stable;
- header controls remain visible;
- Ready to submit and Submit profile remain fully visible and usable;
- narrow layouts stack before clipping;
- only the Profile history table scrolls horizontally inside its own region;
- objective `documentElement.scrollWidth`/`clientWidth` checks report no document overflow;
- Git state, development shutdown and protected configuration remain clean;
- no Administrator terminal or Developer Mode is required.

After this focused retest passes, resume every unfinished M1.02 development/build/preview/browser/accessibility section.

M1.02 must not receive DONE until the owner reports **Overall: PASS**. `LATER-OWNER-003` through `LATER-OWNER-007` remain implementation-fixed but owner-retest pending. M1.03 remains blocked.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
