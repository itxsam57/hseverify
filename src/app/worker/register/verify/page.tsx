import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorkerVerificationForm } from "@/app/worker/register/registration-forms";
import styles from "@/app/worker/register/registration.module.css";
import { BrandMark } from "@/components/brand-mark";
import { Alert } from "@/components/ui/feedback";
import { readWorkerRegistrationToken } from "@/lib/auth/worker-registration-cookie";
import { getWorkerRegistrationService } from "@/lib/auth/worker-registration-service";
import { getServerEnvironment } from "@/lib/config/server-environment";

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
  const initialNow = Date.now();
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
            {isComplete ? "Your Worker account is active." : "Verify each contact in order."}
          </h1>
          <p>
            {isComplete
              ? "Both mandatory contact checks are complete. No permanent Worker ID or portal session was issued during registration."
              : "Only the latest unexpired code is accepted. Refreshing or reopening this page continues the same database-backed verification step."}
          </p>
        </div>
        <p className="auth-security-note">
          Codes are stored as one-way hashes. Sandbox delivery content is encrypted and accessible only through the development/test access-key page.
        </p>
      </section>

      <section className="auth-card-panel" aria-labelledby="verification-card-title">
        <div className="auth-card">
          <p className="eyebrow">Worker registration</p>
          <h2 id="verification-card-title">
            {isComplete
              ? "Activation complete"
              : pendingStep === "pending_email"
                ? "Verify your email"
                : "Verify your phone"}
          </h2>
          <p className="muted-copy">
            {isComplete
              ? "The secure sign-in and session workflow is the next M1.03 subunit."
              : "Do not share the code. Five failed attempts invalidate the current challenge."}
          </p>

          {pendingStep ? (
            <WorkerVerificationForm
              challengeExpiresAt={state.challengeExpiresAt}
              deliveryHint={state.deliveryHint ?? "your contact"}
              initialNow={initialNow}
              resendAvailableAt={state.resendAvailableAt}
              sandboxEnabled={environment.authSandboxEnabled}
              step={pendingStep}
            />
          ) : (
            <>
              <Alert tone="success">
                Email and phone verification passed. The account lifecycle is now active.
              </Alert>
              <div className={styles.completionCard}>
                <strong>Provisional registration reference</strong>
                <p className={styles.reference}>
                  {state.workerReference ?? "Reference unavailable"}
                </p>
                <p>
                  This reference is not the permanent public Worker ID. Permanent ID issuance remains part of the Worker Identity Engine.
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
