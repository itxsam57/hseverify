import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorkerRegistrationForm } from "@/app/worker/register/registration-forms";
import { BrandMark } from "@/components/brand-mark";
import { readWorkerRegistrationToken } from "@/lib/auth/worker-registration-cookie";
import { getWorkerRegistrationService } from "@/lib/auth/worker-registration-service";

export const metadata: Metadata = {
  title: "Worker registration | HSE Verify"
};

type RegistrationPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function WorkerRegistrationPage({
  searchParams
}: RegistrationPageProps): Promise<React.JSX.Element> {
  const token = await readWorkerRegistrationToken();
  if (token) {
    const service = await getWorkerRegistrationService();
    const state = await service.readState(token);
    if (state) {
      redirect("/worker/register/verify");
    }
  }

  const { reason } = await searchParams;

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-brand-panel" aria-labelledby="registration-intro-title">
        <BrandMark light />
        <div className="auth-brand-copy">
          <p className="eyebrow eyebrow-light">Worker registration</p>
          <h1 id="registration-intro-title">Create one verified Worker account.</h1>
          <p>
            Your email is verified first, followed by your mobile phone. The account stays inactive until both checks are complete.
          </p>
        </div>
        <p className="auth-security-note">
          Registration uses expiring one-time codes, an opaque recovery cookie and transaction-safe account state. It does not issue a permanent Worker ID or login session.
        </p>
      </section>

      <section className="auth-card-panel" aria-labelledby="registration-form-title">
        <div className="auth-card">
          <p className="eyebrow">Worker access</p>
          <h2 id="registration-form-title">Register securely</h2>
          <p className="muted-copy">
            Use contact details you can verify now. Duplicate or conflicting details are handled without exposing another account.
          </p>
          <WorkerRegistrationForm cancelled={reason === "cancelled"} />
        </div>
      </section>
    </main>
  );
}
