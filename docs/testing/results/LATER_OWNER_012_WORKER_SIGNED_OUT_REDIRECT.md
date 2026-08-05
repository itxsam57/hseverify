# LATER-OWNER-012 — Worker Signed-Out Dashboard Redirect

Status: **OWNER DEFECT — REPRODUCTION GATE IN PROGRESS**

Reported: 5 August 2026

Area: M1.04 subunit 2 owner hard test, signed-out fixed-role routing.

Tested local commit:

```text
48c406baba404771e508819bf787d084a3a74509
```

## Owner observation

The owner successfully:

- signed in to the Worker portal;
- opened and used the Worker dashboard;
- signed out;
- confirmed Company signed-out dashboard access redirected to Company login.

After Worker logout, opening the Worker dashboard link displayed the global not-found boundary:

```text
Not available

The requested record could not be shown.
The identifier may be invalid, private, unavailable or no longer approved for public display.
```

Expected:

```text
/worker/dashboard
  -> /worker/login?reason=session-required
```

Observed:

```text
/worker/dashboard
  -> global not-found presentation
```

Severity: **release-blocking for M1.04 subunit 2 owner acceptance**.

## Scope

Authenticated Worker access itself passed. The reported defect concerns only the signed-out Worker dashboard request after logout.

Subunit 2 remains owner-test pending. Subunit 3 remains blocked.

## Reproduction and repair rule

1. Add an HTTP runtime test using a real Next development server.
2. Request signed-out Worker and Company dashboard URLs with redirects disabled.
3. Assert fixed-role login redirect status and exact `Location` header.
4. Follow the redirect and assert login page HTTP 200.
5. Assert the global not-found copy is absent.
6. Repair only the proven routing layer if the Worker case fails.
7. Pass focused runtime, complete CI and owner retest before resolution.
