import "server-only";

import { cookies } from "next/headers";

import { authSessionCookieName } from "@/lib/auth/auth-session-cookie-name";

export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 8;

function cookieSecurity() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    priority: "high" as const
  };
}

export async function writeAuthSessionToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(authSessionCookieName(), token, {
    ...cookieSecurity(),
    maxAge: AUTH_SESSION_TTL_SECONDS
  });
}

export async function readAuthSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(authSessionCookieName())?.value ?? null;
}

export async function clearAuthSessionToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(authSessionCookieName(), "", {
    ...cookieSecurity(),
    maxAge: 0
  });
}
