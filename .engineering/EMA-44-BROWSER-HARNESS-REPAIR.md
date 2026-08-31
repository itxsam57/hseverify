# EMA-44 — M2.01 exact Order reference browser locator

## RED evidence

Fresh clean-database retrospective run `33348099100` passed Company registration, Company Admin activation, organization/team, and the complete Worker invitation + Company-code linking workflow before entering M2.01.

At the M2.01 create-order form, Playwright strict mode rejected `getByLabel("Order reference")` because it matched both the exact `Order reference` field and `Purchase order reference`.

## Root cause

The product form exposes two valid, distinct accessible labels. The browser harness used substring label matching for a field that requires exact accessible-name matching.

## Minimal repair

Commit `1c44c3d16f8a6f52199682d2d3d7055ead95a7ce` changes only the test locator to `getByLabel("Order reference", { exact: true })`. No Assurance Order product behavior was changed.

## Verification requirement

A fresh clean-database Chromium run must execute the M2.01 order draft → validate → submit → Assurance Case creation path before EMA-44 can close.
