# EMA-43 — Worker-link card browser-harness locator repair

## RED evidence

Phase 1 retrospective browser run `33347524869` reached `Company Worker invitation and company-code linking workflow` after Company Team passed, then timed out looking for a post-link card containing the obsolete phrase `email invitation`.

The retained failure screenshot proves the product transition succeeded: the invitation is `accepted`, the Worker link exists and is `active`, Site and Department defaults remain attached, Company payment responsibility is retained, and the future assessment reference is retained.

## Root cause

The current Worker-link card deliberately renders `Source: invitation` from the persisted source enum. The retrospective browser harness still filtered for the older phrase `email invitation`.

## Minimal repair

Commit `b2b007de76e3ee0947f485dbe8e1ab93c1baac60` changes only the browser locator to match the current `Source: invitation` label. No Worker invitation or link production behavior was changed.

## Verification requirement

A fresh clean-database Chromium run must pass the existing Worker invitation/link checkpoint and continue through registration-code linking and M2.01 before EMA-43 closes.
