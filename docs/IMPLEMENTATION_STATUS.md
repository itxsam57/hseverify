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
- M1.10 Worker Invitations and Company Codes — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
- M1.11 Employment, Experience, Qualification, Skill and Leaving Records — **IMPLEMENTATION MERGED — ENGINEERING PASS — OWNER ACCEPTANCE DEFERRED TO COMBINED MILESTONE 1 TEST**.
- M1.12 Public Verification Foundation — **IN PROGRESS**.

**Formal Milestone 1 progress: 7 of 12 bricks are DONE.** M1.08–M1.11 are engineering-released but intentionally not counted DONE until the combined Milestone 1 owner/browser acceptance after M1.12.

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

### M1.10
- PR `#76`.
- Final exact verified head `9c3bcfec9b8a5c2a7642dcf63ddcce99c569f725`.
- Targeted gate `31971156192` — PASS.
- Exact-head full Engineering gate `31971157867` — PASS.
- Expected-head-locked merge `3b32287fecb30f16d682cb130be0e8f1eb466616`.
- Merged-main full Engineering gate `31971506738` — PASS.
- Owner/browser acceptance: **DEFERRED, NOT PASSED**.

### M1.11
- PR `#77`.
- Final exact verified head `87f28bac5cb54b06267f51f100f58668f35dc085`.
- Targeted gate `32011610521` — PASS, 27/27.
- Exact-head full Engineering gate `32011610553` — PASS.
- Expected-head-locked merge `ff296f7d59a6505241796f654249c3df6b97763d`.
- Merged-main full Engineering gate `32012346047` — PASS.
- Merged-main evidence includes M1.10 27/27, M1.11 27/27, strict TypeScript, lint 0 errors, production audit 0 vulnerabilities, optimized production build, preview smoke and release manifest.
- Owner/browser acceptance: **DEFERRED, NOT PASSED**.

## Active work

M1.12 is the only active product brick on branch `build/m1-12-public-verification-foundation`, based on exact verified M1.11 merged-main release `ff296f7d59a6505241796f654249c3df6b97763d`.

M1.12 owns the privacy-safe public verification foundation: Worker ID search, non-enumerating/rate-limited public lookup, explicit public-field allow-list projection, opaque public result capability, QR/manual entry foundation, **Report a Concern triage intake**, and one optional private concern-evidence candidate routed through the accepted M1.06 validation/quarantine/malware-scan lifecycle. Evidence binds only after `available`; unsafe/scan-failed candidates remain rejected history and a later clean retry remains possible.

M1.12 concern/file authority is server-created. Browser fields cannot select concern IDs, secure-file IDs, reservation/object keys, storage owner, tenant or membership authority. Retained M1.12 evidence history uses opaque cross-brick secure-file references rather than a hard foreign key so accepted M1.06 rollback/reapply remains independently reversible.

M1.12 does not own full credential issuance, Living Record lifecycle administration, scoped share links, administrator credential suspend/reinstate/revoke/replace workflows, **Reviewer concern/evidence approve/reject/changes-requested decisions**, assessment eligibility/delivery, interview decisions or public access to private evidence.

The existing `/verify/worker/[workerId]` surface is prototype/compatibility context only and is not accepted as proof that M1.12 is complete. New M1.12 behavior must be driven by permanent RED→GREEN tests and the current build gate in `docs/NEXT_BUILD_UNIT.md`.

Provider-dependent production activation remains separately blocked for live email, SMS, private object storage, malware scanning, liveness/face/document checks, video and payments.
