"use client";

import { useActionState } from "react";

import {
  signInWorker,
  type WorkerLoginState
} from "@/app/worker/actions";

const initialState: WorkerLoginState = { error: null };

export function WorkerLoginForm(): React.JSX.Element {
  const [state, action, pending] = useActionState(signInWorker, initialState);

  return (
    <form action={action} className="auth-form" noValidate>
      <div className="field-group">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          maxLength={254}
          required
        />
      </div>

      <div className="field-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={256}
          required
        />
      </div>

      {state.error ? (
        <div className="form-alert form-alert-error" role="alert">
          {state.error}
        </div>
      ) : null}

      <button className="button button-primary button-full" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in to Worker Portal"}
      </button>
    </form>
  );
}
