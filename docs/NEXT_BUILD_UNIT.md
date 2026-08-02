# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current owner gate

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IMPLEMENTED, OWNER RETEST REQUIRED**

Pull request #8 established the shared design system, responsive Worker shell, keyboard/focus contracts, accessible table and dialog primitives, and live adoption across Worker routes. It was squash-merged as `ddd3bccc40a4176b394c138d2d12a3fdf2f3a767`.

Windows owner testing has found six release-blocking engineering defects:

1. `LATER-OWNER-003` — portable preview copying attempted to recreate a traced PGlite symbolic link and failed with `EPERM`.
2. `LATER-OWNER-004` — protected runtime smoke wrote partial development types into the same `.next` directory later consumed by production build.
3. `LATER-OWNER-005` — passing automated Next commands left tracked `next-env.d.ts` and `tsconfig.json` modified.
4. `LATER-OWNER-006` — after PR #11, ordinary `npm run dev` still invoked raw `next dev` and rewrote tracked root `tsconfig.json`, including changing `jsx` from `preserve` to `react-jsx`.
5. `LATER-OWNER-007` — Worker Profile created page-wide horizontal overflow at normal desktop width, clipping Ready to submit and Submit profile and allowing the entire shell/sidebar to move horizontally.
6. `LATER-OWNER-008` — the Profile overflow contract used an exact LF-only CSS block string and failed on a Windows CRLF checkout despite the correct containment declaration being present.

PR #9 was squash-merged as `d849ec933f61c5296a3fc981ef57e470445f2ee1` and rewrote portable preview copying.

PR #10 was squash-merged as `ef2d623192e9da3b822ed0114d633fb788660d17` and isolated protected runtime smoke from production output.

PR #11 was squash-merged as `36e1cfc9c5395cffbce330c56cfbbe19fca4871a` and replaced the automated type-generation, runtime-smoke and production-build configuration system.

PR #12 was squash-merged as `4f04a525f39f203f6def7915647c68a6718303a8` and added the missing protected ordinary-development path, real development HTTP smoke and post-Ctrl+C configuration verification.

PR #13 was squash-merged as `612e8948c24bb007e0dfc6f266b0c81a50a7408a` and rewrote Worker shell/Profile width containment with container-based reflow and table-local horizontal scrolling.

## LATER-OWNER-008 — Windows line-ending-sensitive overflow contract

The first Windows owner retest after PR #13 completed `npm ci` with zero vulnerabilities and left `git status --short` empty. The focused regression then returned:

```text
pass 3
fail 1
```

The failing assertion was:

```text
assert.ok(profile.includes(".profile-history-card {\n  overflow: hidden;\n}"))
```

The Windows checkout used CRLF. The real `src/app/profile.css` still contained the required `.profile-history-card` rule with `overflow: hidden`, so the failure was in the validator rather than the production layout.

## Pull request #14 — platform-stable Profile overflow validation

PR #14 corrects the test architecture without changing production CSS:

- normalizes CRLF and legacy CR source text before inspection;
- replaces exact multiline formatting checks with CSS selector/declaration assertions;
- verifies `.profile-history-card` declares `overflow: hidden`;
- verifies `.profile-history-card .ds-table-wrap` declares `overflow-x: auto`;
- verifies table overscroll containment remains active;
- verifies the shared table keeps its intended minimum width;
- adds a synthetic CRLF test so Linux CI exercises the Windows checkout path;
- updates the focused owner guide to require five tests passing and zero failures.

This repair must pass the complete application, runtime, build, preview and artifact workflow before merge. After merge, the owner must rerun the focused test on Windows and require:

```text
tests 5
pass 5
fail 0
```

## Mandatory focused Windows retest

Follow:

- `docs/testing/M1_02_PROFILE_OVERFLOW_RETEST.md`

The retest must prove:

- the five overflow contracts pass on the normal Windows CRLF checkout;
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

M1.02 must not receive DONE until the owner reports **Overall: PASS**. `LATER-OWNER-003` through `LATER-OWNER-008` remain implementation-fixed but owner-retest pending. M1.03 remains blocked.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
