# Public verification hardening — 9 September 2026

This repair preserves the canonical M1.12 scope and does not mark the product or deferred owner acceptance complete.

Reproduced defects:

- Rotating User-Agent produced a fresh persisted request budget, allowing request 31.
- Leaving `/verify` while the detector promise stalled left the media track live.
- Result capabilities remained valid at the exact expiry instant.
- Independent review found that Next preserves caller-supplied forwarding headers; an unconfigured origin therefore cannot trust them as client identity.

The server now ignores User-Agent for rate identity and ignores forwarded addresses unless `HSE_PUBLIC_VERIFICATION_TRUSTED_IP_HEADER` names a trusted ingress header. Both configuration validators reject malformed names. Only one valid IP is accepted; IPv6 spelling is normalized. Unconfigured, missing, malformed and multi-address inputs share a conservative budget.

Before enabling production public traffic, configure an ingress that overwrites the selected header with one validated address and prevents direct origin access. Verify the ingress contract using actual external requests. Without this configuration, all visitors share the 30-lookups-per-10-minute fallback limit. This is a remaining production activation requirement, not per-user production protection.

QR sessions now release streams on navigation, explicit cancellation and a deadline that also bounds permission/playback/detection waits. Late results from a cancelled session cannot modify a replacement session. The source-only ban on every React effect was replaced with real browser assertions for zero camera acquisition on load and stream cleanup on navigation; cleanup effects themselves are necessary.

Permanent coverage is in the existing M1.12 tests and `scripts/public-verification-browser-qa.mjs`, with a dedicated pull-request workflow. The browser harness uses a generated MediaStream and a stalled detector to test resource ownership; it does not claim physical-camera QR accuracy. It also submits real Server Actions against PGlite while rotating forwarding headers and User-Agent, checks the enforced budget and checks mobile overflow and browser errors.

Independent review found no blocking regression in the changed code; trusted ingress activation remains an explicit release prerequisite. Full project verification and all 37 frozen roadmap requirements remain governed by the canonical bookmarks and the audit ledger.

The full gate additionally exposed critical/high dependency advisories. Next.js, @next/env and eslint-config-next are pinned to 16.3.4; the sharp override is 0.35.4. The lockfile security floors now reject earlier vulnerable releases. Production dependency audit returned zero vulnerabilities after the upgrade. References: https://github.com/advisories/GHSA-p293-qw3h-jr36, https://github.com/advisories/GHSA-2xp9-vwfh-vxw4 and https://github.com/advisories/GHSA-rgj7-g3m4-5g8c.
