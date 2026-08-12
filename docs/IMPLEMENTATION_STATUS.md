# Implementation Status

## Milestone 1

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS**.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS — 11 August 2026**.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED M1.08 + M1.09 TEST**.
- M1.09 Sites, Departments and Company Team — **IN PROGRESS — PR #75**.
- M1.10 Worker Invitations and Company Codes — **BLOCKED**.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records — **BLOCKED**.
- M1.12 Public Verification Foundation — **BLOCKED**.

**Formal Milestone 1 progress: 7 of 12 bricks are DONE.** M1.08 is engineering-released but is intentionally not counted DONE until the owner/browser acceptance that the owner requested to run together with M1.09.

## M1.08 engineering release

- PR `#74`.
- Exact verified head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`.
- Exact-head gate `31476983323` — PASS.
- Expected-head-locked merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`.
- Merged-main gate `31483852831` — PASS.
- Owner/browser acceptance: **DEFERRED, NOT PASSED**.

## Active work

M1.09 is the only active product brick. Branch `build/m1-09-sites-departments-company-team`, draft PR `#75`, based on exact M1.08 release `c58bac4cb743b78b9e562d6eca179ff857ba8c17`.

M1.09 must deliver tenant-scoped Sites and Departments in one management interface, safe archival with historical assignment retention, and Company Team invitation/membership/role/scope/permission management separate from Workers. Company Team enrollment reuses the accepted staff invitation/password/TOTP path.

M1.10+ remain blocked until M1.09 passes exact-head and merged-main engineering gates and the combined M1.08 + M1.09 owner/browser acceptance succeeds.

Provider-dependent production activation remains separately blocked for live email, SMS, private object storage, malware scanning, liveness/face/document checks, video and payments.
