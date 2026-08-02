import "server-only";

import { cookies } from "next/headers";

const REGISTRATION_COOKIE_TTL_SECONDS = 60 * 60;

function registrationCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-hse_worker_registration"
    : "hse_worker_registration";
}

export async function writeWorkerRegistrationToken(
  token: string
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(registrationCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/worker/register",
    maxAge: REGISTRATION_COOKIE_TTL_SECONDS,
    priority: "high"
  });
}

export async function readWorkerRegistrationToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(registrationCookieName())?.value ?? null;
}

export async function clearWorkerRegistrationToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(registrationCookieName());
}
