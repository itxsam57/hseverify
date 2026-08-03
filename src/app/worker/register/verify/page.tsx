import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorkerVerificationForm } from "@/app/worker/register/registration-forms";
import styles from "@/app/worker/register/registration.module.css";
import { BrandMark } from "@/components/brand-mark";
import { Alert } from "@/components/ui/feedback";
import { PRODUCT_COPY } from "@/config/product-copy";
import { readWorkerRegistrationToken } from "@/lib/auth/worker-registration-cookie";
import { getWorkerRegistrationService } from "@/lib/auth/worker-registration-service";
import { getServerEnvironment } from "@/lib/config/server-environment";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify Worker contacts | HSE Verify"
};

export default async function WorkerRegistrationVerificationPage(): Promise<React.JSX.Element> {
  const token = await readWorkerRegistrationToken();
  if (!token) {
    redirect("/worker/register?reason=restart");
  }

  const service = await getWorkerRegistrationService();
  const state = await service.readState(token);
  if (!state) {
    redirect("/worker/register?reason=restart");
  }

  const environment = getServerEnvironment();
  const copy = PRODUCT_COPY.workerRegistration;
  const pendingStep =
    state.step === "pending_email" || state.step === "pending_phone"
      ? state.step
      : null;
  const isComplete = pendingStep === null;

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-brand-panel" aria-labelledby="verification-intro-title">
        <BrandMark light />
        <div className="auth-brand-copy">
          <p className="eyebrow eyebrow-light">Contact verification</p>
          <h1 id="verification-intro-title">
            {isComplete ? "Your Worker account is active" : "Verify your contact details"}
          </h1>
          <p>
            {isComplete
              ? "Both checks are complete. Sign in separately to enter the Worker portal."
              : copy.verificationOrder}
          </p>
        </div>
        <p className="auth-security-note">
          Use only the latest code for the contact shown on this page.
        </p>
      </section>

      <section className="auth-card-panel" aria-labelledby="verification-card-title">
        <div className="auth-card">
          <p className="eyebrow">Worker registration</p>
          <h2 id="verification-card-title">
            {isComplete
              ? "Activation complete"
              : pendingStep === "pending_email"
                ? copy.emailStepTitle
                : copy.phoneStepTitle}
          </h2>

          {pendingStep ? (
            <WorkerVerificationForm
              key={pendingStep}
              challengeExpiresAt={state.challengeExpiresAt}
              deliveryHint={state.deliveryHint ?? "your contact"}
              resendAvailableAt={state.resendAvailableAt}
              sandboxEnabled={environment.authSandboxEnabled}
              step={pendingStep}
            />
          ) : (
            <>
              <Alert tone="success">
                Email and phone verification passed.
              </Alert>
              <div className={styles.completionCard}>
                <strong>Provisional registration reference</strong>
                <p className={styles.reference}>
                  {state.workerReference ?? "Reference unavailable"}
                </p>
                <p>
                  This is not the permanent public Worker ID. Permanent ID issuance belongs to the Worker Identity Engine.
                </p>
              </div>
              <div className={styles.linkRow}>
                <Link href="/">Return to public website</Link>
                <Link href="/worker/login">Worker sign-in</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
