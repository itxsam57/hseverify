# Implementation Status

## Milestone 1

- M1.01 Repository, Environments and CI/CD — **DONE — OWNER PASS**.
- M1.02 Design System and Global UX — **DONE — OWNER PASS**.
- M1.03 Authentication and Portal Isolation — **DONE — OWNER PASS**.
- M1.04 Authorization and Tenant Isolation — **DONE — OWNER PASS**.
- M1.05 Audit and Notification Foundations — **DONE — OWNER PASS**.
- M1.06 Secure Storage and Upload Pipeline — **DONE — ENGINEERING PASS**.
- M1.07 Worker Onboarding and Identity Engine — **DONE — OWNER PASS — 11 August 2026**.
- M1.08 Company Registration and Verification — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
- M1.09 Sites, Departments and Company Team — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
- M1.10 Worker Invitations and Company Codes — **IN PROGRESS**.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records — **BLOCKED**.
- M1.12 Public Verification Foundation — **BLOCKED**.

**Formal Milestone 1 progress: 7 of 12 bricks are DONE.** M1.08 and M1.09 are engineering-released but intentionally not counted DONE until the one combined Milestone 1 owner/browser acceptance requested by the owner after M1.10–M1.12 are built.

## Engineering release evidence

### M1.08
- PR `#74`.
- Exact verified head `1da43b43a0c81efaa70c5ccecf19d037d3199c28`.
- Exact-head gate `31476983323` — PASS.
- Expected-head-locked merge `c58bac4cb743b78b9e562d6eca179ff857ba8c17`.
- Merged-main gate `31483852831` — PASS.
- Owner/browser acceptance: **DEFERRED, NOT PASSED**.

### M1.09
- PR `#75`.
- Exact verified head `32130f82b661b86d7ad08f5dad7a368346cfe13d`.
- Exact-head gate `31569523799` — PASS.
- Expected-head-locked merge `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`.
- Merged-main gate `31569898065` — PASS.
- Owner/browser acceptance: **DEFERRED, NOT PASSED**.

## Active work

M1.10 is the only active product brick on branch `build/m1-10-worker-invitations-company-codes`, based on exact green M1.09 merged-main release `1fe96b412db3cfa4e370a2d60cd13ce00aa3e3bf`.

M1.10 owns Worker invitations, bulk invitation validation, Company registration codes, expiry/usage/revoke/resend controls, active same-tenant Site/Department and payment defaults, and Company↔Worker linking. It must reuse accepted Worker registration/contact verification and Worker-ID authority and must not create a parallel authentication, Worker identity or M2 assessment system.

M1.11+ remain blocked until M1.10 passes exact-head and merged-main engineering release gates. Owner/browser acceptance remains deferred to the combined Milestone 1 test.

Provider-dependent production activation remains separately blocked for live email, SMS, private object storage, malware scanning, liveness/face/document checks, video and payments.