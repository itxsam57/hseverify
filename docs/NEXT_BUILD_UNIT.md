# Next Build Unit

## Current gate — owner hard test

Do not begin another product feature yet.

The owner must first test the merged Worker Dashboard and Worker Profile using:

- `docs/testing/WORKER_DASHBOARD_PROFILE_HARD_TEST.md`

Any defect must be recorded in:

- `docs/bookmarks/LATER.md`

The current milestone position and full path are controlled by:

- `docs/bookmarks/MILESTONE_PATH.md`

## Corrected next engineering sequence after owner acceptance

Worker Identity is part of **M1.07**, but its upload workflow depends on incomplete earlier bricks. Therefore the next work is not to jump directly into identity-document screens.

Resume in canonical dependency order:

1. Close M1.01 — environment, database/migration, preview deployment and rollback foundation.
2. Close M1.02 — shared design system and global UX contract.
3. Close M1.03 — real authentication, mandatory email/phone OTP and role-specific portal isolation.
4. Close M1.04 — authorization and company tenant isolation.
5. Close M1.05 — immutable audit/outbox and persisted notifications.
6. Close M1.06 — secure private upload, quarantine, scan and signed-preview pipeline.
7. Resume M1.07 — Worker Identity submission and correction evidence.

## M1.07 identity scope when prerequisites pass

- document type selection and jurisdiction-aware requirements;
- metadata, front, back and supporting-file uploads;
- independent form/upload state;
- draft and committed identity versions;
- photograph and liveness adapter/fallback boundary;
- duplicate-worker signals and controlled review;
- Worker ID issuance rules;
- worker-visible processing and verification status;
- changes-requested resubmission with retained history;
- correction evidence linked to pending sensitive-profile correction requests;
- reviewer-safe metadata and signed preview;
- authorization, audit, notification, loading, success, failure and conflict states;
- automated tests and owner hard-test instructions.

Identity evidence must never silently replace a verified record. Every committed version, request and decision remains traceable.
