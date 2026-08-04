import "server-only";

import { headers } from "next/headers";

function fingerprintFromHeaders(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 256) ?? "unknown";
  return `${forwardedFor || realIp || "unknown"}|${userAgent}`;
}

export async function registrationRequestFingerprint(): Promise<string> {
  return fingerprintFromHeaders(await headers());
}

export function registrationRouteRequestFingerprint(request: Request): string {
  return fingerprintFromHeaders(request.headers);
}

export function isSameOriginRegistrationPost(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
