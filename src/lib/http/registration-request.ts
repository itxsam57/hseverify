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

function firstForwardedValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first || null;
}

export function isSameOriginRegistrationPost(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const browserOrigin = new URL(origin).origin;
    const requestUrl = new URL(request.url);
    const allowedOrigins = new Set<string>([requestUrl.origin]);

    // Next.js and trusted reverse proxies can expose an internal request.url host
    // while the browser correctly sends Origin/Host for the public endpoint.
    // CSRF authority is therefore the browser Origin compared with the effective
    // HTTP request host, not one internal URL serialization.
    const host = request.headers.get("host")?.trim();
    const forwardedHost = firstForwardedValue(request.headers.get("x-forwarded-host"));
    const forwardedProto = firstForwardedValue(request.headers.get("x-forwarded-proto"));
    const requestProto = requestUrl.protocol.slice(0, -1);
    const protocols = new Set<string>([requestProto]);
    if (forwardedProto === "http" || forwardedProto === "https") {
      protocols.add(forwardedProto);
    }

    for (const effectiveHost of [host, forwardedHost]) {
      if (!effectiveHost) continue;
      for (const protocol of protocols) {
        allowedOrigins.add(new URL(`${protocol}://${effectiveHost}`).origin);
      }
    }

    return allowedOrigins.has(browserOrigin);
  } catch {
    return false;
  }
}
