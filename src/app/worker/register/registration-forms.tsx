"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import {
  cancelWorkerRegistration,
  resendWorkerRegistrationCode,
  startWorkerRegistration,
  verifyWorkerRegistration,
  type RegistrationActionState
} from "@/app/worker/register/actions";
import styles from "@/app/worker/register/registration.module.css";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";

const INITIAL_STATE: RegistrationActionState = {
  error: null,
  message: null,
  retryAt: null
};

function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export function WorkerRegistrationForm({
  cancelled = false
}: {
  cancelled?: boolean;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(
    startWorkerRegistration,
    INITIAL_STATE
  );
  const errors = state.fieldErrors ?? {};

  return (
    <>
      {cancelled ? (
        <Alert tone="success">The previous registration attempt was cancelled safely.</Alert>
      ) : null}
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <form action={action} className={styles.formGrid} noValidate>
        <Field
          error={errors.displayName}
          htmlFor="displayName"
          label="Full name"
        >
          <Input
            aria-describedby={describedBy(
              errors.displayName && "displayName-error"
            )}
            aria-invalid={Boolean(errors.displayName)}
            autoComplete="name"
            id="displayName"
            maxLength={120}
            name="displayName"
            required
          />
        </Field>

        <div className={styles.twoColumn}>
          <Field error={errors.email} htmlFor="email" label="Email address">
            <Input
              aria-describedby={describedBy(errors.email && "email-error")}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              id="email"
              inputMode="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
          </Field>

          <Field
            error={errors.phone}
            hint="Use international format, for example +923001234567."
            htmlFor="phone"
            label="Mobile phone"
          >
            <Input
              aria-describedby={describedBy(
                "phone-hint",
                errors.phone && "phone-error"
              )}
              aria-invalid={Boolean(errors.phone)}
              autoComplete="tel"
              id="phone"
              inputMode="tel"
              maxLength={20}
              name="phone"
              placeholder="+923001234567"
              required
              type="tel"
            />
          </Field>
        </div>

        <div className={styles.twoColumn}>
          <Field
            error={errors.password}
            hint="Use 12–128 characters with uppercase, lowercase, number and symbol."
            htmlFor="password"
            label="Create password"
          >
            <Input
              aria-describedby={describedBy(
                "password-hint",
                errors.password && "password-error"
              )}
              aria-invalid={Boolean(errors.password)}
              autoComplete="new-password"
              id="password"
              maxLength={128}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </Field>

          <Field
            error={errors.confirmPassword}
            htmlFor="confirmPassword"
            label="Confirm password"
          >
            <Input
              aria-describedby={describedBy(
                errors.confirmPassword && "confirmPassword-error"
              )}
              aria-invalid={Boolean(errors.confirmPassword)}
              autoComplete="new-password"
              id="confirmPassword"
              maxLength={128}
              minLength={12}
              name="confirmPassword"
              required
              type="password"
            />
          </Field>
        </div>

        <p className={styles.passwordNote}>
          Email verification happens first. Phone verification follows before the account can become active.
        </p>

        <Button disabled={pending} fullWidth type="submit">
          {pending ? "Starting secure registration…" : "Create Worker account"}
        </Button>
      </form>

      <ul className={styles.securityList}>
        <li>Your one-time codes expire and can be used only once.</li>
        <li>The account remains inactive until both contacts are verified.</li>
        <li>A permanent Worker ID is not created during registration.</li>
      </ul>

      <div className={styles.linkRow}>
        <Link href="/worker/login">Already registered? Worker sign in</Link>
        <Link href="/">Exit to public website</Link>
      </div>
    </>
  );
}

function secondsUntil(value: string | null, now: number): number {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - now) / 1000));
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function WorkerVerificationForm({
  step,
  deliveryHint,
  resendAvailableAt,
  challengeExpiresAt,
  sandboxEnabled
}: {
  step: "pending_email" | "pending_phone";
  deliveryHint: string;
  resendAvailableAt: string | null;
  challengeExpiresAt: string | null;
  sandboxEnabled: boolean;
}): React.JSX.Element {
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyWorkerRegistration,
    INITIAL_STATE
  );
  const [resendState, resendAction, resending] = useActionState(
    resendWorkerRegistrationCode,
    INITIAL_STATE
  );
  const effectiveRetryAt = resendState.retryAt ?? resendAvailableAt;
  const [nowTick, setNowTick] = useState<number | null>(null);

  useEffect(() => {
    const updateClock = () => setNowTick(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const resendSeconds =
    nowTick === null ? null : secondsUntil(effectiveRetryAt, nowTick);
  const expirySeconds =
    nowTick === null ? null : secondsUntil(challengeExpiresAt, nowTick);
  const codeError = verifyState.fieldErrors?.code;
  const isEmail = step === "pending_email";

  return (
    <>
      <ol aria-label="Registration verification progress" className={styles.progress}>
        <li
          className={`${styles.progressItem} ${
            isEmail ? styles.progressActive : styles.progressDone
          }`}
        >
          <strong>Email verification</strong>
          <span>{isEmail ? "Current step" : "Completed"}</span>
        </li>
        <li
          className={`${styles.progressItem} ${
            isEmail ? "" : styles.progressActive
          }`}
        >
          <strong>Phone verification</strong>
          <span>{isEmail ? "Next step" : "Current step"}</span>
        </li>
      </ol>

      <Alert tone="neutral">
        Enter the six-digit code sent to <strong>{deliveryHint}</strong>.
      </Alert>
      {verifyState.error ? <Alert tone="danger">{verifyState.error}</Alert> : null}
      {resendState.error ? <Alert tone="danger">{resendState.error}</Alert> : null}
      {resendState.message ? (
        <Alert tone="success">{resendState.message}</Alert>
      ) : null}

      <form action={verifyAction} className={styles.formGrid} noValidate>
        <Field
          error={codeError}
          hint="Codes expire after ten minutes and cannot be replayed."
          htmlFor="code"
          label="Verification code"
        >
          <Input
            aria-describedby={describedBy(
              "code-hint",
              codeError && "code-error"
            )}
            aria-invalid={Boolean(codeError)}
            autoComplete="one-time-code"
            className={styles.codeInput}
            id="code"
            inputMode="numeric"
            maxLength={6}
            minLength={6}
            name="code"
            pattern="[0-9]{6}"
            required
          />
        </Field>

        <p aria-live="polite" className={styles.verificationMeta}>
          {expirySeconds === null
            ? "Checking the code expiry time…"
            : expirySeconds > 0
              ? `This code expires in ${formatSeconds(expirySeconds)}.`
              : "This code may have expired. Request a new code if verification fails."}
        </p>

        <div className={styles.actionStack}>
          <Button disabled={verifying} fullWidth type="submit">
            {verifying
              ? "Checking code…"
              : isEmail
                ? "Verify email and continue"
                : "Verify phone and activate account"}
          </Button>
        </div>
      </form>

      <div className={styles.secondaryActions}>
        <form action={resendAction}>
          <Button
            disabled={resending || resendSeconds === null || resendSeconds > 0}
            fullWidth
            type="submit"
            variant="secondary"
          >
            {resending
              ? "Sending…"
              : resendSeconds === null
                ? "Checking resend time…"
                : resendSeconds > 0
                  ? `Resend in ${formatSeconds(resendSeconds)}`
                  : "Send a new code"}
          </Button>
        </form>
        {sandboxEnabled ? (
          <Link
            className="ds-button ds-button-secondary ds-button-full"
            href="/worker/register/sandbox"
          >
            Open sandbox inbox
          </Link>
        ) : (
          <Link
            className="ds-button ds-button-secondary ds-button-full"
            href="/"
          >
            Exit safely
          </Link>
        )}
      </div>

      <details className={styles.startOver}>
        <summary>Cancel and start registration again</summary>
        <p>
          This invalidates current registration codes and removes this browser&apos;s continuation access. It does not create a Worker ID or login session.
        </p>
        <form action={cancelWorkerRegistration}>
          <Button type="submit" variant="danger">
            Cancel this registration
          </Button>
        </form>
      </details>
    </>
  );
}
