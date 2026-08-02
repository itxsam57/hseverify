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
5. `LATER-OWNER-007` — the Worker Profile created page-wide horizontal overflow at normal desktop width, clipping the Ready to submit panel and Submit profile button and allowing the entire shell/sidebar to move horizontally.

PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and rewrote portable preview copying.

PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated protected runtime smoke from production output.

PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced the automated type-generation, runtime-smoke and production-build configuration system.

PR #12 was squash-merged as `4f04a525f39f203f6def7915647c68a6718303a8` and added the missing protected ordinary-development path, real development HTTP smoke and post-Ctrl+C configuration verification.

## Owner defect LATER-OWNER-007

The owner tested commit `362793d` on Windows 10, Node.js `v22.23.1` and Google Chrome at normal desktop width and 100% zoom.

At:

```text
http://localhost:3000/worker/profile
```

the complete Worker Portal became wider than the browser viewport. The page gained a horizontal scrollbar, scrolling right moved the sidebar and application shell off screen, the Ready to submit panel was clipped and the Submit profile button was partly outside the visible viewport.

The defect remained after `Ctrl+0` and `Ctrl+F5`, proving it was a real layout-width failure rather than browser zoom or stale cache.

## Pull request #13 — Profile and shell width-model rewrite

The review found that Profile responsiveness was based on full viewport media queries even though desktop Profile content receives the viewport minus the fixed 260px sidebar and portal padding. The Profile action/history column also retained a fixed 300px minimum, and shrink containment was incomplete through shell, Profile grid, card, form and table ancestors.

PR #13 rewrites that width model:

- adds a dedicated shell-containment stylesheet loaded before Profile styles;
- guarantees `width: 100%`, `min-width: 0` and `max-width: 100%` through portal shell, main column, header, content and child boundaries;
- preserves the 260px desktop sidebar without allowing it to enlarge the page;
- makes the Profile page a named inline-size container;
- changes the Profile editor/action layout to `minmax(0, 1fr) minmax(16rem, 22rem)`;
- removes the fixed 300px right-column minimum;
- stacks summary, editor/action layout and aside at a 62rem Profile-container threshold;
- stacks steps, facts, fields and action controls at a 46rem Profile-container threshold;
- bounds form fields, status content, action descendants and Submit profile controls to their cards;
- makes the Profile history table wrapper the only horizontal scroll region;
- prevents intrinsic table width from propagating into the document;
- retains viewport media-query fallbacks;
- does not hide page-wide overflow on `body` or the entire portal shell.

## Permanent regression

PR #13 adds `test:profile-overflow` to `npm run check`.

The suite permanently verifies:

1. shell and Profile shrink containment through every layout boundary;
2. Profile history owns the only horizontal scroll region;
3. Profile action controls remain bounded by their cards;
4. normal desktop, 860px, 768px, 390px, 320px and 125%/150%/200% zoom switch layout before clipping.

The first complete technical run passed workflow `30747176028`, job `91494637373`, including all four overflow contracts, the full application gate, normal-development HTTP smoke, protected PGlite runtime, deterministic production build, portable preview and artifact upload. Final exact-head validation remains mandatory after all governance records are complete.

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
