# EMA-43 — Worker-link card browser-harness locator repair

## RED evidence 1 — email invitation source

Phase 1 retrospective browser run `33347524869` reached `Company Worker invitation and company-code linking workflow` after Company Team passed, then timed out looking for a post-link card containing the obsolete phrase `email invitation`.

The retained failure screenshot proves the product transition succeeded: the invitation is `accepted`, the Worker link exists and is `active`, Site and Department defaults remain attached, Company payment responsibility is retained, and the future assessment reference is retained.

The canonical Worker-link card renders `Source: invitation` from the persisted source enum.

## Minimal repair 1

Commit `b2b007de76e3ee0947f485dbe8e1ab93c1baac60` changes only the browser locator to match `Source: invitation`. No Worker invitation or link production behavior was changed.

## RED evidence 2 — Company registration-code source

Fresh clean-database retrospective run `33347773778` on merge SHA `7f859527c9af0cc0df27d854fed6e9f4a4889322` passed the invitation-source boundary and advanced through registration-code onboarding before timing out on a second stale post-link selector containing `registration code`.

Retained artifact `9742600062` proves the production transition succeeded:

- the Company registration code is `exhausted` with `1 of 1 uses consumed`;
- the new Worker link is `active`;
- Site and Department defaults remain attached;
- Company payment responsibility remains attached;
- future assessment reference `RETRO-COMPANY-CODE-001` remains attached;
- canonical UI renders `Source: code`.

## Minimal repair 2

Commit `b9274d8acc96250d0b147b79a781c31f255e4537` changes only the browser locator to match `Source: code`. No registration-code or Worker-link production behavior was changed.

## Verification requirement

A fresh clean-database Chromium run must pass the complete `Company Worker invitation and company-code linking workflow` checkpoint and continue to later retrospective checkpoints before EMA-43 closes.
