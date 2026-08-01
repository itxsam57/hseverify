"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createWorkerSession,
  deleteWorkerSession,
  secureStringEqual
} from "@/lib/auth/worker-session";

export type WorkerLoginState = {
  error: string | null;
};

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function normalizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function readPassword(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

async function requestKey(email: string): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  return `${forwardedFor || realIp || "unknown"}:${email}`;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return false;
  }

  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }

  current.count += 1;
}

export async function signInWorker(
  _previousState: WorkerLoginState,
  formData: FormData
): Promise<WorkerLoginState> {
  if (process.env.HSE_ENABLE_WORKER_DEMO_AUTH !== "true") {
    return {
      error: "Worker authentication is not configured in this environment."
    };
  }

  const email = normalizeEmail(formData.get("email"));
  const password = readPassword(formData.get("password"));

  if (!email || email.length > 254 || !password || password.length > 256) {
    return { error: "Enter a valid email address and password." };
  }

  const key = await requestKey(email);
  if (isRateLimited(key)) {
    return {
      error: "Too many sign-in attempts. Wait before trying again."
    };
  }

  const expectedEmail = (process.env.HSE_WORKER_DEMO_EMAIL ?? "").trim().toLowerCase();
  const expectedPassword = process.env.HSE_WORKER_DEMO_PASSWORD ?? "";
  const emailMatches = secureStringEqual(email, expectedEmail);
  const passwordMatches = secureStringEqual(password, expectedPassword);

  if (!expectedEmail || !expectedPassword || !emailMatches || !passwordMatches) {
    recordFailure(key);
    return { error: "The email or password is incorrect." };
  }

  attempts.delete(key);
  await createWorkerSession({
    sub: `worker:${email}`,
    email,
    displayName: process.env.HSE_WORKER_DEMO_NAME ?? "Worker",
    workerId: process.env.HSE_WORKER_DEMO_ID ?? "HSE-WRK-000001"
  });

  redirect("/worker/dashboard");
}

export async function signOutWorker(): Promise<void> {
  await deleteWorkerSession();
  redirect("/worker/login?reason=signed-out");
}
