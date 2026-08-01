import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_TTL_SECONDS = 60 * 60 * 8;
const DEVELOPMENT_SECRET = "hse-verify-development-session-secret-change-me";

type WorkerRole = "worker";

export type WorkerSession = {
  sub: string;
  role: WorkerRole;
  email: string;
  displayName: string;
  workerId: string;
  issuedAt: number;
  expiresAt: number;
};

function sessionCookieName(): string {
  return process.env.NODE_ENV === "production"
    ? "__Host-hse_worker_session"
    : "hse_worker_session";
}

function sessionSecret(): string {
  const configured = process.env.HSE_SESSION_SECRET;
  if (configured && configured.length >= 32) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_SECRET;
  }

  throw new Error("HSE_SESSION_SECRET must contain at least 32 characters.");
}

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signature(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function isWorkerSession(value: unknown): value is WorkerSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WorkerSession>;
  return (
    typeof candidate.sub === "string" &&
    candidate.role === "worker" &&
    typeof candidate.email === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.workerId === "string" &&
    typeof candidate.issuedAt === "number" &&
    typeof candidate.expiresAt === "number"
  );
}

export async function createWorkerSession(input: {
  sub: string;
  email: string;
  displayName: string;
  workerId: string;
}): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const claims: WorkerSession = {
    ...input,
    role: "worker",
    issuedAt: now,
    expiresAt: now + SESSION_TTL_SECONDS
  };
  const payload = encode(JSON.stringify(claims));
  const value = `${payload}.${signature(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName(), value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    priority: "high"
  });
}

export async function readWorkerSession(): Promise<WorkerSession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(sessionCookieName())?.value;
  if (!value) {
    return null;
  }

  const [payload, suppliedSignature, unexpected] = value.split(".");
  if (!payload || !suppliedSignature || unexpected) {
    return null;
  }

  if (!constantTimeEqual(signature(payload), suppliedSignature)) {
    return null;
  }

  try {
    const claims: unknown = JSON.parse(decode(payload));
    if (!isWorkerSession(claims)) {
      return null;
    }

    if (claims.expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return claims;
  } catch {
    return null;
  }
}

export async function requireWorkerSession(): Promise<WorkerSession> {
  const session = await readWorkerSession();
  if (!session) {
    redirect("/worker/login?reason=session-required");
  }

  return session;
}

export async function deleteWorkerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName());
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}
