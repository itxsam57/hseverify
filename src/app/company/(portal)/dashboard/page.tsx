import Link from "next/link";

import { requireRoleSession } from "@/lib/auth/auth-session-service";

export default async function CompanyDashboardPage(): Promise<React.JSX.Element> {
  const session = await requireRoleSession("company");

  return (
    <div className="dashboard-page">
      <header className="page-heading-row">
        <div>
          <p className="eyebrow">Company Portal</p>
          <h1>Welcome, {session.displayName}</h1>
          <p className="page-intro">
            Authentication, mandatory TOTP, role isolation and the trusted Company tenant boundary are active. Real Company operations remain behind their later milestone gates.
          </p>
        </div>
      </header>

      <section className="metric-grid" aria-label="Company authentication status">
        <article className="metric-card">
          <strong>Role fixed</strong>
          <p>{session.role}</p>
        </article>
        <article className="metric-card">
          <strong>Session expires</strong>
          <p>{new Date(session.expiresAt).toLocaleString()}</p>
        </article>
        <article className="metric-card">
          <strong>MFA</strong>
          <p>Required and verified at sign-in.</p>
        </article>
      </section>

      <section className="dashboard-section" aria-labelledby="tenant-demonstration-heading">
        <p className="section-kicker">M1.04 protected demonstration</p>
        <h2 id="tenant-demonstration-heading">Prove the current Company tenant boundary</h2>
        <p>
          Open a neutral workspace that lists and changes only records belonging to the Company tenant resolved from this session. It does not accept a tenant selector and does not create real Company business data.
        </p>
        <Link className="button button-primary" href="/company/tenant-scope">
          Open tenant-scope demonstration
        </Link>
      </section>

      <section className="dashboard-section" aria-labelledby="company-boundary-heading">
        <p className="section-kicker">Security boundary</p>
        <h2 id="company-boundary-heading">What this portal permits</h2>
        <ul>
          <li>Only the active Company tenant membership resolved by the server may be used.</li>
          <li>This session cannot enter Worker, assessor, verifier, administrator or root workspaces.</li>
          <li>Company registration, workers, sites, departments, team permissions and operational records remain blocked until their canonical bricks.</li>
        </ul>
        <Link className="button button-secondary" href="/account/sessions">
          Review active sessions
        </Link>
      </section>
    </div>
  );
}
