import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { readWorkerRegistrationToken } from "@/lib/auth/worker-registration-cookie";
import {
  RegistrationServiceError,
  getWorkerRegistrationService
} from "@/lib/auth/worker-registration-service";
import {
  isSameOriginRegistrationPost,
  registrationRequestFingerprint
} from "@/lib/http/registration-request";

function redirectTo(request: Request, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRegistrationPost(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const token = await readWorkerRegistrationToken();
  if (!token) {
    return redirectTo(request, "/worker/register?reason=restart");
  }

  try {
    const service = await getWorkerRegistrationService();
    await service.resend({
      token,
      requestFingerprint: await registrationRequestFingerprint()
    });
    revalidatePath("/worker/register/verify");
    return redirectTo(request, "/worker/register/verify?status=resent");
  } catch (error) {
    if (
      error instanceof RegistrationServiceError &&
      (error.code === "flow_missing" || error.code === "flow_expired")
    ) {
      return redirectTo(request, "/worker/register?reason=restart");
    }
    const code =
      error instanceof RegistrationServiceError &&
      error.code === "challenge_cooldown"
        ? "cooldown"
        : "unavailable";
    return redirectTo(request, `/worker/register/verify?error=${code}`);
  }
}
