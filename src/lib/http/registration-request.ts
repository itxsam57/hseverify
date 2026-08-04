import "server-only";

import { headers } from "next/headers";

export async function registrationRequestFingerprint(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 256) ?? "unknown";
  return `${forwardedFor || realIp || "unknown"}|${userAgent}`;
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
