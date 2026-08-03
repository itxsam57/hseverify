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
import { PRODUCT_COPY } from "@/config/product-copy";

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
  const copy = PRODUCT_COPY.workerRegistration;

  return (
    <>
      {cancelled ? (
        <Alert tone="success">The previous registration attempt was cancelled.</Alert>
      ) : null}
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <form action={action} className={styles.formGrid} noValidate>
        <Field error={errors.displayName} htmlFor="displayName" label="Full name">
          <Input
            aria-describedby={describedBy(errors.displayName && "displayName-error")}
            aria-invalid={Boolean(errors.displayName)}
            autoComplete="name"
            id="displayName"
            maxLength={120}
            name="displayName"
            required
          />
        </Field>

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
          hint={copy.phoneHint}
          htmlFor="phone"
          label="Mobile phone"
        >
          <Input
            aria-describedby={describedBy("phone-hint", errors.phone && "phone-error")}
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

        <Field error={errors.password} htmlFor="password" label="Create password">
          <Input
            aria-describedby={describedBy(
              "password-guidance",
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
              "password-guidance",
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

        <p className={styles.passwordNote} id="password-guidance">
          {copy.passwordHint}
        </p>
        <p className={styles.passwordNote}>{copy.verificationOrder}</p>

        <Button disabled={pending} fullWidth type="submit">
          {pending ? "Creating account…" : "Create Worker account"}
        </Button>
      </form>

      <div className={styles.linkRow}>
        <Link href="/worker/login">Worker sign-in</Link>
        <Link href="/">Exit</Link>
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
  const copy = PRODUCT_COPY.workerRegistration;

  return (
    <>
      <p className={styles.stepLine}>
        Step {isEmail ? "1 of 2" : "2 of 2"}: {isEmail ? "email" : "phone"}
      </p>
      <p className={styles.deliveryLine}>
        Code sent to <strong>{deliveryHint}</strong>
      </p>

      {verifyState.error ? <Alert tone="danger">{verifyState.error}</Alert> : null}
      {resendState.error ? <Alert tone="danger">{resendState.error}</Alert> : null}
      {resendState.message ? <Alert tone="success">{resendState.message}</Alert> : null}

      <form action={verifyAction} className={styles.formGrid} noValidate>
        <Field error={codeError} hint={copy.codeHint} htmlFor="code" label="Verification code">
          <Input
            aria-describedby={describedBy("code-hint", codeError && "code-error")}
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
            ? "Checking expiry…"
            : expirySeconds > 0
              ? `Expires in ${formatSeconds(expirySeconds)}.`
              : "Expired. Request a new code."}
        </p>

        <Button disabled={verifying} fullWidth type="submit">
          {verifying
            ? "Checking code…"
            : isEmail
              ? "Verify email"
              : "Verify phone"}
        </Button>
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
                  : "Send new code"}
          </Button>
        </form>
        {sandboxEnabled ? (
          <Link
            aria-label="Open sandbox inbox"
            className="ds-button ds-button-secondary ds-button-full"
            href="/worker/register/sandbox"
          >
            {copy.sandboxLabel}
          </Link>
        ) : null}
      </div>

      <details className={styles.startOver}>
        <summary>Cancel registration</summary>
        <form action={cancelWorkerRegistration}>
          <Button type="submit" variant="danger">
            Cancel and start again
          </Button>
        </form>
      </details>
    </>
  );
}
