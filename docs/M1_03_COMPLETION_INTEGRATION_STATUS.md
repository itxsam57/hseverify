# M1.03 Completion Integration Status

## Status

M1.03 remaining authentication and portal-isolation scope is under integration on branch `build/m1-03-complete-auth-and-isolation`.

Implemented for validation:

- fixed-role database-backed sign-in for Worker, Company, assessor, verifier, administrator and root;
- persisted lockout and rate limiting;
- mandatory TOTP verification and replay-counter enforcement for every non-Worker role;
- opaque revocable session cookie with no role switching;
- active-session list and owned-session revocation;
- password recovery with one-time email OTP, password replacement and all-session revocation;
- invitation-only staff provisioning;
- TOTP enrollment before privileged account use;
- development/test-only first-root bootstrap;
- isolated portal layouts and cross-role access denial;
- migration `0004_authentication_completion` with independent rollback.

This document does not mark M1.03 complete. The branch still requires strict CI, permanent completion regressions, code review, merge and one complete Windows owner hard test.
