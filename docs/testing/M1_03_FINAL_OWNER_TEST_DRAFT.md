# M1.03 Final Owner Test — Draft

The final owner test will be issued only after complete CI and merge.

It will cover, in one Windows test sequence:

1. Worker registration with mandatory email and phone sandbox OTP.
2. Worker password sign-in, lockout and recovery.
3. Session persistence, sign-out, list and revocation.
4. First-root sandbox bootstrap.
5. Root invitation, staff password creation and TOTP enrollment.
6. Company, assessor, verifier, administrator and root fixed-role login.
7. Copied-URL and cross-role dashboard denial.
8. Direct protected-action denial.
9. Stale and revoked session denial.
10. Password-reset all-session revocation.
11. Four-layer migration rollback and reapply.
12. Full `npm run check`, responsive UI checks and clean Git state.

M1.03 remains IN PROGRESS until this final owner test passes.
