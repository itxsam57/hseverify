# Bookmark: Milestone Path

## Authority

This bookmark is the permanent build-order record for HSE Verify Phase 1.

The controlling source is **HSE Verify — Master Product, Feature, Workflow, UX and Engineering Specification, Phase 1 Frozen Scope, dated 1 August 2026**. Earlier prototypes, chats, design maps and roadmap summaries may explain intent, but they do not override that canonical specification.

No implementation note, pull request or assistant-created `NEXT_BUILD_UNIT` file may silently change this path.

## Why Worker Identity was previously named as the next unit

The owner instructed the rebuild to start with the Worker Dashboard. That created an intentional vertical slice inside Milestone 1 instead of beginning with every foundation brick in strict numerical order.

The sequence used was:

1. Worker Dashboard foundation.
2. Worker Profile and onboarding continuation.
3. Worker Identity submission and correction evidence.

The third item came from the Worker onboarding journey, where personal details are followed by identity-document upload, and from Milestone brick **M1.07 Worker onboarding and Identity Engine**.

That was a valid **worker-journey sequence**, but it was not a complete replacement for the milestone dependency order. Identity uploads depend on unfinished authentication, authorization, audit/notification and secure-upload foundations. Therefore the corrected next path is to close those prerequisites before continuing the Identity Engine.

## Current owner gate

**PAUSED FOR OWNER HARD TEST**

Implemented and awaiting owner acceptance:

- Worker Dashboard foundation.
- Worker Profile and onboarding continuation.

No new feature brick should be merged until the owner completes the published hard-test checklist or explicitly authorizes continuation with recorded defects.

## Current Milestone 1 position

| Brick | Canonical capability | Current status | Required before it is complete |
|---|---|---|---|
| M1.01 | Repository, environments and CI/CD | Partial | Production-like environment separation, validated configuration, database migration baseline, preview deployment, rollback and release evidence. |
| M1.02 | Design system and global UX | Partial | Shared portal-wide tokens/components, dialogs, tables, forms, responsive rules, accessibility checks and consistent loading/empty/error behavior. |
| M1.03 | Authentication and portal isolation | Partial | Real Worker and Company registration, mandatory email and phone OTP, reset/recovery, staff provisioning, MFA, account lifecycle and every role-specific login/guard. Current Worker demo authentication is not production authentication. |
| M1.04 | Authorization and tenant isolation | Not started as a complete platform brick | Permission model, company tenancy, query guards, field visibility, cross-role/cross-tenant denial tests and security audit events. |
| M1.05 | Audit and notification foundations | Partial | Immutable platform audit events, outbox/jobs, persisted in-app notifications, email queue, retries and role-specific deep links. Current profile audit and demo notification projection are not the complete foundation. |
| M1.06 | Secure storage and upload pipeline | Not started | Private object storage contract, independent form state, MIME/extension/size/signature checks, quarantine, malware-scan adapter, signed preview/download and access logging. |
| M1.07 | Worker onboarding and Identity Engine | Partial | Dashboard and profile exist; identity documents, photograph/liveness adapter, duplicate detection, Worker ID issuance rules, corrections, review states and status timeline remain. |
| M1.08 | Company registration and verification | Not started | Tenant creation, initial administrator, company verification case and settings. |
| M1.09 | Sites, departments and team | Not started | Combined interface, archival, staff invitations and scoped company permissions. |
| M1.10 | Worker invitations and company codes | Not started | Single/bulk invitations, limits, defaults, payment responsibility and worker linking. |
| M1.11 | Employment, experience, skill and leaving-letter records | Not started | Integrated drafts, independent evidence uploads, verification states and history preservation. |
| M1.12 | Public verification foundation | Partial prototype only | Real Worker/Credential search, safe projection, neutral not-found response, report-concern workflow, rate limiting and QR route base. |

## Corrected execution order from this point

After the owner accepts the current Worker Dashboard/Profile hard test:

1. **Close M1.01** — environments, configuration validation, database/migration foundation, preview deployment and rollback.
2. **Close M1.02** — shared design system and global UX contract across the existing Worker routes.
3. **Close M1.03** — real registration/login, mandatory email and phone OTP, recovery, staff provisioning and role-bound portal guards.
4. **Close M1.04** — permission and tenant-isolation model with direct-endpoint security tests.
5. **Close M1.05** — immutable audit/outbox and persisted notification delivery foundation.
6. **Close M1.06** — secure private upload pipeline and scan/preview adapters.
7. **Resume M1.07** — Worker Identity submission, photograph/liveness boundary, duplicate detection, corrections, review states and Worker ID rules.
8. Continue M1.08 through M1.12 in order.
9. Run the full Milestone 1 exit test before starting Milestone 2.

## Canonical three-milestone roadmap

### Milestone 1 — Platform Foundation, Identity and Company Trust

1. M1.01 Repository, environments and CI/CD.
2. M1.02 Design system and global UX.
3. M1.03 Authentication and portal isolation.
4. M1.04 Authorization and tenant isolation.
5. M1.05 Audit and notification foundations.
6. M1.06 Secure storage and upload pipeline.
7. M1.07 Worker onboarding and Identity Engine.
8. M1.08 Company registration and verification.
9. M1.09 Sites, departments and team.
10. M1.10 Worker invitations and company codes.
11. M1.11 Employment, experience, skill and leaving-letter records.
12. M1.12 Public verification foundation.

**Exit gate:** a worker can securely register, verify both contact channels, submit identity/evidence, receive a Worker ID, join a verified company and appear in the company directory. Portal isolation, tenant isolation, audit and secure uploads must pass security testing.

### Milestone 2 — Assurance, Assessments, Review and Interviews

1. M2.01 Assurance Order and Case Engine.
2. M2.02 Evidence verification queues.
3. M2.03 Frameworks and Effective Policy.
4. M2.04 MCQ and written Question Bank, rubrics, approval, versioning and retirement.
5. M2.05 Randomized assessment-form generation with exposure history and permanent non-repetition while unseen alternatives exist.
6. M2.06 Assessment catalogue, eligibility, attempts, waiting, assignment and funding.
7. M2.07 Candidate assessment window with one-question delivery, mandatory answer-before-next and emergency exit.
8. M2.08 Answer persistence and interruption recovery with auto-save, offline buffer, idempotent submission and replacement form.
9. M2.09 Integrity Engine with camera, microphone, screen/browser events, classifications and degraded mode.
10. M2.10 Written scoring and Review Engine with rubrics, human authority, conflicts and calibration.
11. M2.11 Interview scheduling and candidate-specific assignment.
12. M2.12 Interview console and structured playbook.
13. M2.13 Decision Engine with reasons, states, overrides and audit.

**Exit gate:** an eligible worker completes a uniquely generated monitored assessment, retains written answers through interruption, passes through review, attends a structured platform interview and receives an auditable final decision.

### Milestone 3 — Credentials, Enterprise Operations and Production Readiness

1. M3.01 Credential and QR issuance.
2. M3.02 Digital Passport and Living Record.
3. M3.03 Scoped share links.
4. M3.04 Company Action Centre and analytics.
5. M3.05 Billing and subscriptions.
6. M3.06 Reports and delivery.
7. M3.07 Appeals, renewal, suspension and revocation.
8. M3.08 Admin operational completeness.
9. M3.09 Privacy and accessibility operations.
10. M3.10 Production integrations.
11. M3.11 Load, security and recovery certification.
12. M3.12 Production launch and operational handover.

**Exit gate:** the complete Phase 1 product works end to end with credentials, company operations, billing, reporting, administration, provider activation or truthful disabled modes, security/load/recovery certification, runbooks and release acceptance.

## Definition of Done for every brick

A brick cannot be called complete merely because a page renders or CI compiles. It must include:

1. Source requirement and workflow traceability.
2. Permission, role, tenant and field-visibility rules.
3. Data model, states, versions and preservation rules.
4. Security and privacy threat review.
5. Server commands/queries and API contract.
6. UI route, every control and all loading/success/empty/error/conflict states.
7. Audit, notification, job and provider-adapter consequences.
8. Unit, contract, integration, route, security, accessibility and responsive tests appropriate to the brick.
9. Automated CI evidence.
10. Step-by-step owner hard-test instructions.
11. Owner-reported defects fixed and retested.
12. Documentation and both bookmarks updated before merge.

## Bookmark update rule

Every feature pull request must update this file with:

- current brick;
- status change;
- exact next dependency;
- owner test status;
- any deviation approved by the owner.

If the path changes, the change must be explicit, explained and visible in the pull request. Silent roadmap changes are prohibited.
