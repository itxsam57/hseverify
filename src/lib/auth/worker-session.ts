import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";

import {
  readAuthenticatedSession,
  requireRoleSession,
  revokeCurrentAuthenticationSession
} from "@/lib/auth/auth-session-service";

export type WorkerSession = {
  sub: string;
  role: "worker";
  email: string;
  displayName: string;
  workerId: string;
  issuedAt: number;
  expiresAt: number;
};

function toWorkerSession(session: {
  accountId: string;
  role: "worker";
  email: string;
  displayName: string;
  createdAt: string;
  expiresAt: string;
}): WorkerSession {
  return {
    sub: session.accountId,
    role: "worker",
    email: session.email,
    displayName: session.displayName,
    workerId: session.accountId,
    issuedAt: Math.floor(Date.parse(session.createdAt) / 1000),
    expiresAt: Math.floor(Date.parse(session.expiresAt) / 1000)
  };
}

export async function readWorkerSession(): Promise<WorkerSession | null> {
  const session = await readAuthenticatedSession();
  if (!session || session.role !== "worker") return null;
  return toWorkerSession({ ...session, role: "worker" });
}

export async function requireWorkerSession(): Promise<WorkerSession> {
  const session = await requireRoleSession("worker");
  return toWorkerSession({ ...session, role: "worker" });
}

export async function deleteWorkerSession(): Promise<void> {
  await revokeCurrentAuthenticationSession();
}

export async function redirectToWorkerLogin(): Promise<never> {
  redirect("/worker/login?reason=session-required");
}

export function secureStringEqual(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left, "utf8").digest();
  const rightDigest = createHash("sha256").update(right, "utf8").digest();
  return timingSafeEqual(leftDigest, rightDigest);
}
