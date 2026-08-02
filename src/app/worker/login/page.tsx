import Link from "next/link";

import { WorkerLoginForm } from "@/app/worker/login/login-form";
import { readWorkerSession } from "@/lib/auth/worker-session";

export default async function WorkerLoginPage({
  searchParams
}: {
  searchParams: Promise<{ reason?: string }>;
}): Promise<React.JSX.Element> {
  const session = await readWorkerSession();
  const { reason } = await searchParams;

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-labelledby="worker-login-heading">
        <Link className="brand-mark brand-mark-light" href="/" aria-label="HSE Verify home">
          <span className="brand-symbol" aria-hidden="true">HV</span>
          <span>HSE Verify</span>
        </Link>
        <div className="auth-brand-copy">
          <p className="eyebrow eyebrow-light">Worker Portal</p>
          <h1 id="worker-login-heading">Your verified record, assessments and credentials in one place.</h1>
          <p>
            This portal is isolated from company, reviewer, assessor and administrator access.
            A different portal requires a full sign-out and separate login.
          </p>
        </div>
        <p className="auth-security-note">
          Protected by a role-bound session. Never share your password or one-time verification code.
        </p>
      </section>

      <section className="auth-card-panel" aria-label="Worker sign in">
        <div className="auth-card">
          <p className="eyebrow">Secure access</p>
          <h2>Sign in as a worker</h2>
          <p className="muted-copy">
            Use the worker account registered to your personal email address.
          </p>

          {reason === "signed-out" ? (
            <div className="form-alert form-alert-success" role="status">
              You have been signed out safely.
            </div>
          ) : null}

          {reason === "session-required" ? (
            <div className="form-alert" role="status">
              Sign in to continue to the Worker Portal.
            </div>
          ) : null}

          {session ? (
            <div className="existing-session-card">
              <p>You already have an active Worker Portal session.</p>
              <Link className="button button-primary button-full" href="/worker/dashboard">
                Continue to dashboard
              </Link>
            </div>
          ) : (
            <WorkerLoginForm />
          )}

          <div className="auth-footer-links">
            <Link href="/worker/register">Create a Worker account</Link>
            <span aria-hidden="true"> · </span>
            <Link href="/">Exit to public website</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
