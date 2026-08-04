import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { readWorkerRegistrationChallengeBinding } from "@/lib/auth/worker-registration-challenge-binding";
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

function errorCode(error: unknown): string {
  if (!(error instanceof RegistrationServiceError)) return "unavailable";
  switch (error.code) {
    case "invalid_code":
      return "invalid-code";
    case "challenge_expired":
      return "expired";
    case "challenge_missing":
    case "wrong_step":
      return "stale-code";
    case "flow_missing":
    case "flow_expired":
      return "restart";
    default:
      return "unavailable";
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOriginRegistrationPost(request)) {
    return new Response("Forbidden", { status: 403 });
  }

  const token = await readWorkerRegistrationToken();
  if (!token) {
    return redirectTo(request, "/worker/register?reason=restart");
  }

  const formData = await request.formData();
  const codeValue = formData.get("code");
  const challengeValue = formData.get("challengeId");
  const code = typeof codeValue === "string" ? codeValue.trim() : "";
  const challengeId =
    typeof challengeValue === "string" ? challengeValue.trim() : "";

  if (!/^\d{6}$/.test(code) || !/^otp_[A-Za-z0-9_-]{24}$/.test(challengeId)) {
    return redirectTo(
      request,
      "/worker/register/verify?error=invalid-format"
    );
  }

  const binding = await readWorkerRegistrationChallengeBinding(token);
  if (!binding) {
    return redirectTo(request, "/worker/register?reason=restart");
  }
  if (!binding.challengeId || binding.challengeId !== challengeId) {
    return redirectTo(request, "/worker/register/verify?error=stale-code");
  }

  try {
    const service = await getWorkerRegistrationService();
    const result = await service.verify({
      token,
      code,
      requestFingerprint: await registrationRequestFingerprint()
    });
    const stage =
      result.state.step === "pending_phone"
        ? "phone"
        : result.state.step === "complete"
          ? "complete"
          : "email";

    // BUILD-PIN AUTH-REG-OTP-POST:
    // Keep OTP verification as a normal same-origin POST + 303 redirect. Do not
    // move this back behind client action state; owner testing proved that path
    // could submit without a reliable visible transition.
    revalidatePath("/worker/register/verify");
    return redirectTo(request, `/worker/register/verify?stage=${stage}`);
  } catch (error) {
    const code = errorCode(error);
    if (code === "restart") {
      return redirectTo(request, "/worker/register?reason=restart");
    }
    return redirectTo(request, `/worker/register/verify?error=${code}`);
  }
}
