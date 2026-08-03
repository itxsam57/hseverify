import "server-only";

import { redirect } from "next/navigation";

import {
  ROLE_HOME_PATHS,
  ROLE_LOGIN_PATHS,
  createIdentifier,
  createOpaqueToken,
  hashOpaqueValue,
  type AuthRole
} from "@/lib/auth/auth-domain";
import {
  clearAuthSessionToken,
  readAuthSessionToken,
  writeAuthSessionToken,
  AUTH_SESSION_TTL_SECONDS
} from "@/lib/auth/auth-session-cookie";
import {
  getAuthAccessRepository,
  type ActiveSessionSummary
} from "@/lib/auth/auth-access-repository";
import { getServerEnvironment } from "@/lib/config/server-environment";

const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export type AuthenticatedSession = {
  sessionId: string;
  accountId: string;
  role: AuthRole;
  email: string;
  displayName: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

function tokenHash(token: string): string {
  const environment = getServerEnvironment();
  return hashOpaqueValue(token, environment.authPepper, "auth-session");
}

function metadataHash(value: string | null, context: string): string | null {
  if (!value) return null;
  const environment = getServerEnvironment();
  return hashOpaqueValue(value, environment.authPepper, context);
}

function addSeconds(value: Date, seconds: number): string {
  return new Date(value.getTime() + seconds * 1000).toISOString();
}

export async function createAuthenticationSession(input: {
  accountId: string;
  role: AuthRole;
  userAgent: string | null;
  ipAddress: string | null;
  now?: Date;
}): Promise<{ sessionId: string; token: string }> {
  const repository = await getAuthAccessRepository();
  const environment = getServerEnvironment();
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const token = createOpaqueToken();
  const csrfToken = createOpaqueToken();
  const sessionId = createIdentifier("session");

  await repository.authentication.insertSession({
    sessionId,
    accountId: input.accountId,
    activeRole: input.role,
    tokenHash: hashOpaqueValue(token, environment.authPepper, "auth-session"),
    csrfTokenHash: hashOpaqueValue(
      csrfToken,
      environment.authPepper,
      "auth-session-csrf"
    ),
    userAgentHash: metadataHash(input.userAgent, "auth-session-user-agent"),
    ipAddressHash: metadataHash(input.ipAddress, "auth-session-ip"),
    createdAt: nowIso,
    lastSeenAt: nowIso,
    expiresAt: addSeconds(now, AUTH_SESSION_TTL_SECONDS)
  });

  return { sessionId, token };
}

export async function establishAuthenticationSession(input: {
  accountId: string;
  role: AuthRole;
  userAgent: string | null;
  ipAddress: string | null;
}): Promise<string> {
  const created = await createAuthenticationSession(input);
  await writeAuthSessionToken(created.token);
  return created.sessionId;
}

export async function readAuthenticatedSession(): Promise<AuthenticatedSession | null> {
  const rawToken = await readAuthSessionToken();
  if (!rawToken) return null;

  const repository = await getAuthAccessRepository();
  const now = new Date();
  const nowIso = now.toISOString();
  const record = await repository.authentication.findActiveSessionByTokenHash(
    tokenHash(rawToken),
    nowIso
  );
  if (!record) return null;

  const account = await repository.authentication.findAccountById(
    record.accountId
  );
  if (!account || account.status !== "active") return null;

  const lastSeenAt = Date.parse(record.lastSeenAt);
  if (
    Number.isFinite(lastSeenAt) &&
    now.getTime() - lastSeenAt >= SESSION_TOUCH_INTERVAL_MS
  ) {
    await repository.authentication.touchSession(record.sessionId, nowIso);
  }

  return {
    sessionId: record.sessionId,
    accountId: account.accountId,
    role: record.activeRole,
    email: account.email,
    displayName: account.displayName,
    createdAt: record.createdAt,
    lastSeenAt: record.lastSeenAt,
    expiresAt: record.expiresAt
  };
}

export async function requireAuthenticatedSession(): Promise<AuthenticatedSession> {
  const session = await readAuthenticatedSession();
  if (!session) {
    redirect("/worker/login?reason=session-required");
  }
  return session;
}

export async function requireRoleSession(
  expectedRole: AuthRole
): Promise<AuthenticatedSession> {
  const session = await readAuthenticatedSession();
  if (!session) {
    redirect(`${ROLE_LOGIN_PATHS[expectedRole]}?reason=session-required`);
  }

  if (session.role !== expectedRole) {
    const repository = await getAuthAccessRepository();
    await repository.authentication.insertSecurityEvent({
      eventId: createIdentifier("event"),
      accountId: session.accountId,
      eventType: "access_denied",
      activeRole: session.role,
      metadata: {
        reason: "portal_role_mismatch",
        expectedRole
      },
      occurredAt: new Date().toISOString()
    });
    redirect("/access-denied");
  }

  return session;
}

export async function revokeCurrentAuthenticationSession(
  reason = "user_logout"
): Promise<AuthRole | null> {
  const rawToken = await readAuthSessionToken();
  const repository = await getAuthAccessRepository();
  let role: AuthRole | null = null;

  if (rawToken) {
    const record = await repository.authentication.findActiveSessionByTokenHash(
      tokenHash(rawToken),
      new Date().toISOString()
    );
    if (record) {
      role = record.activeRole;
      const revokedAt = new Date().toISOString();
      await repository.authentication.revokeSession({
        sessionId: record.sessionId,
        revokedAt,
        reason
      });
      await repository.authentication.insertSecurityEvent({
        eventId: createIdentifier("event"),
        accountId: record.accountId,
        eventType: "logout",
        activeRole: record.activeRole,
        metadata: { reason },
        occurredAt: revokedAt
      });
    }
  }

  await clearAuthSessionToken();
  return role;
}

export async function listOwnActiveSessions(
  session: AuthenticatedSession
): Promise<ActiveSessionSummary[]> {
  const repository = await getAuthAccessRepository();
  return repository.listActiveSessions(
    session.accountId,
    new Date().toISOString()
  );
}

export async function revokeOwnSession(input: {
  session: AuthenticatedSession;
  targetSessionId: string;
}): Promise<boolean> {
  const repository = await getAuthAccessRepository();
  const revokedAt = new Date().toISOString();
  const revoked = await repository.revokeOwnedSession({
    accountId: input.session.accountId,
    sessionId: input.targetSessionId,
    revokedAt,
    reason: "user_revoked"
  });
  if (revoked) {
    await repository.authentication.insertSecurityEvent({
      eventId: createIdentifier("event"),
      accountId: input.session.accountId,
      eventType: "session_revoked",
      activeRole: input.session.role,
      metadata: {
        targetSessionId: input.targetSessionId,
        self: input.targetSessionId === input.session.sessionId
      },
      occurredAt: revokedAt
    });
  }
  return revoked;
}

export function authenticatedHomePath(role: AuthRole): string {
  return ROLE_HOME_PATHS[role];
}

export function authenticatedLoginPath(role: AuthRole): string {
  return ROLE_LOGIN_PATHS[role];
}
