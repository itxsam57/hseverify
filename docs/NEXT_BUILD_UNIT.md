# Next Build Unit

## Previous accepted owner gates

- **Worker Dashboard and Worker Profile vertical slice: PASSED — 2 August 2026**
- **M1.01 Windows PGlite functional repair path: PASSED — 2 August 2026**

The owner completed the repaired Windows path, loaded the existing database, filled the full Worker Profile and confirmed that it saved. `LATER-OWNER-001` is resolved.

## Current owner gate

**M1.01 — IMPLEMENTED, FINAL UI/SECURITY OWNER RETEST REQUIRED**

The same owner test found:

- `LATER-OWNER-002`: Worker Profile controls visually blended into the page and did not show clear boxes;
- three high-severity production-path transitive advisories reported after successful `npm ci`.

Pull request #7 repairs and gates both findings:

- visible input/select/textarea boundaries;
- hover, keyboard-focus, disabled, placeholder and validation-error states;
- responsive form layout and checkbox/action feedback;
- permanent Worker Profile UX architecture validation;
- PostCSS `8.5.18` and Sharp `0.35.3` compatibility overrides;
- deterministic lockfile security floors;
- production `npm audit` inside the trusted `npm run check` path;
- `LATER-044` to prevent silent removal of the overrides before Next.js resolves compatible patched dependencies.

## Mandatory retest

After PR #7 is merged, follow:

- `docs/testing/M1_01_PROFILE_UI_SECURITY_RETEST.md`

M1.01 must not receive DONE until the owner confirms visible controls and focus states, successful save/refresh/restart persistence, successful `npm ci`, zero high production audit findings and a complete passing `npm run check`.

## Next allowed brick after M1.01 acceptance

**M1.02 — Design system and global UX contract**

After M1.02 passes its own owner test, continue in canonical order:

1. M1.03 — production authentication, mandatory email and phone OTP, recovery and role-specific portal isolation.
2. M1.04 — authorization and tenant isolation.
3. M1.05 — immutable audit/outbox and persisted notifications.
4. M1.06 — secure private upload pipeline.
5. Resume M1.07 — Worker Identity Engine.
