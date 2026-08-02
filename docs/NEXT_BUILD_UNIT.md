# Next Build Unit

## Accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Repository, environments and CI/CD: PASSED — 2 August 2026**

M1.01 is DONE. The accepted platform foundation includes validated environments, PostgreSQL-compatible persistence, migrations, preview/release evidence, guarded rollback, Windows-native PGlite application runtime, correct error boundaries, visible Profile controls and the production dependency audit gate.

`LATER-OWNER-001` and `LATER-OWNER-002` are resolved. `LATER-044` remains an explicit maintenance obligation for the temporary PostCSS/Sharp compatibility overrides.

## Current build unit

**M1.02 — DESIGN SYSTEM AND GLOBAL UX — IN PROGRESS**

Active branch:

```text
feature/m1-02-design-system
```

The brick must deliver:

- shared semantic design tokens;
- reusable buttons and form controls;
- alerts, badges, cards, empty and loading states;
- accessible tables and confirmation dialogs;
- desktop and mobile portal navigation continuity;
- keyboard, focus, disabled and validation states;
- 200% zoom and narrow-screen safety;
- reduced-motion, higher-contrast and forced-colour behavior;
- permanent automated design-system checks;
- owner acceptance across login, Dashboard, Profile, account menu and sign-out.

## Mandatory acceptance

After CI and merge, follow:

- `docs/testing/M1_02_DESIGN_SYSTEM_HARD_TEST.md`

M1.02 must not receive DONE until the owner reports **Overall: PASS**. Any failure must be added to `docs/bookmarks/LATER.md` as `LATER-OWNER-###`, repaired and retested.

## Next allowed brick after M1.02 acceptance

**M1.03 — Authentication and portal isolation**

M1.03 includes real Worker registration, mandatory email and phone OTP, password/recovery lifecycle, session/device controls, staff provisioning, MFA and complete role-specific portal guards. Demonstration Worker authentication does not satisfy M1.03.

After M1.03 passes its own owner test, continue in canonical order:

1. M1.04 — authorization and tenant isolation.
2. M1.05 — immutable audit/outbox and persisted notifications.
3. M1.06 — secure private upload pipeline.
4. Resume M1.07 — Worker Identity Engine.
