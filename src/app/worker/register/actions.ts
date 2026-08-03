"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { OtpChannel } from "@/lib/auth/auth-domain";
import {
  AuthenticationSandboxError,
  readLatestAuthenticationSandboxCode
} from "@/lib/auth/auth-sandbox-service";
import {
  RegistrationServiceError,
  getWorkerRegistrationService
} from "@/lib/auth/worker-registration-service";
import {
  clearWorkerRegistrationToken,
  readWorkerRegistrationToken,
  writeWorkerRegistrationToken
} from "@/lib/auth/worker-registration-cookie";

export type RegistrationActionState = {
  error: string | null;
  message: string | null;
  retryAt: string | null;
  fieldErrors?: Partial<
    Record<"displayName" | "email" | "phone" | "password" | "confirmPassword" | "code", string>
  >;
};

export type SandboxDeliveryState = {
  error: string | null;
  code: string | null;
  deliveryHint: string | null;
  createdAt: string | null;
};

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

async function requestFingerprint(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const realIp = requestHeaders.get("x-real-ip")?.trim();
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 256) ?? "unknown";
  return `${forwardedFor || realIp || "unknown"}|${userAgent}`;
}

function actionError(error: unknown): RegistrationActionState {
  if (error instanceof RegistrationServiceError) {
    return {
      error: error.userMessage,
      message: null,
      retryAt: error.retryAt
    };
  }
  return {
    error: "Registration could not be completed. Try again safely.",
    message: null,
    retryAt: null
  };
}

export async function startWorkerRegistration(
  _previousState: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const displayName = formText(formData, "displayName");
  const email = formText(formData, "email");
  const phone = formText(formData, "phone");
  const password = formText(formData, "password");
  const confirmPassword = formText(formData, "confirmPassword");
  const fieldErrors: RegistrationActionState["fieldErrors"] = {};

  if (!displayName.trim()) fieldErrors.displayName = "Enter your full name.";
  if (!email.trim()) fieldErrors.email = "Enter your email address.";
  if (!phone.trim()) fieldErrors.phone = "Enter your phone number.";
  if (!password) fieldErrors.password = "Create a password.";
  if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "The passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Check the highlighted registration details.",
      message: null,
      retryAt: null,
      fieldErrors
    };
  }

  try {
    const service = await getWorkerRegistrationService();
    const result = await service.start({
      displayName,
      email,
      phone,
      password,
      requestFingerprint: await requestFingerprint()
    });
    await writeWorkerRegistrationToken(result.token);
  } catch (error) {
    return actionError(error);
  }

  redirect("/worker/register/verify");
}

export async function verifyWorkerRegistration(
  _previousState: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const token = await readWorkerRegistrationToken();
  if (!token) {
    return {
      error: "Start registration again to continue.",
      message: null,
      retryAt: null
    };
  }

  const code = formText(formData, "code").trim();
  if (!/^\d{6}$/.test(code)) {
    return {
      error: "Enter the six-digit verification code.",
      message: null,
      retryAt: null,
      fieldErrors: { code: "Use exactly six numbers." }
    };
  }

  let nextStage: "email" | "phone" | "complete";
  try {
    const service = await getWorkerRegistrationService();
    const result = await service.verify({
      token,
      code,
      requestFingerprint: await requestFingerprint()
    });
    nextStage =
      result.state.step === "pending_phone"
        ? "phone"
        : result.state.step === "complete"
          ? "complete"
          : "email";
  } catch (error) {
    return actionError(error);
  }

  // BUILD-PIN AUTH-REG-VERIFY-REFRESH:
  // Keep a stage-changing URL after a successful OTP. Redirecting to the same
  // URL can preserve the old client form and make a valid code appear rejected.
  revalidatePath("/worker/register/verify");
  redirect(`/worker/register/verify?stage=${nextStage}`);
}

export async function resendWorkerRegistrationCode(
  previousState: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  void previousState;
  void formData;
  const token = await readWorkerRegistrationToken();
  if (!token) {
    return {
      error: "Start registration again to continue.",
      message: null,
      retryAt: null
    };
  }

  try {
    const service = await getWorkerRegistrationService();
    const state = await service.resend({
      token,
      requestFingerprint: await requestFingerprint()
    });
    return {
      error: null,
      message: `A new code was sent to ${state.deliveryHint ?? "your verified contact"}.`,
      retryAt: state.resendAvailableAt
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelWorkerRegistration(): Promise<void> {
  const token = await readWorkerRegistrationToken();
  if (token) {
    const service = await getWorkerRegistrationService();
    await service.cancel(token);
  }
  await clearWorkerRegistrationToken();
  redirect("/worker/register?reason=cancelled");
}

export async function readSandboxDelivery(
  _previousState: SandboxDeliveryState,
  formData: FormData
): Promise<SandboxDeliveryState> {
  const channelValue = formText(formData, "channel");
  const channel: OtpChannel | null =
    channelValue === "email" || channelValue === "phone"
      ? channelValue
      : null;
  const destination = formText(formData, "destination");
  const accessKey = formText(formData, "accessKey");

  if (!channel || !destination || !accessKey) {
    return {
      error: "Enter the channel, destination and sandbox access key.",
      code: null,
      deliveryHint: null,
      createdAt: null
    };
  }

  try {
    const delivery = await readLatestAuthenticationSandboxCode({
      channel,
      destination,
      accessKey
    });
    return {
      error: null,
      code: delivery.code,
      deliveryHint: delivery.deliveryHint,
      createdAt: delivery.createdAt
    };
  } catch (error) {
    return {
      error:
        error instanceof AuthenticationSandboxError
          ? error.userMessage
          : "The sandbox delivery could not be opened.",
      code: null,
      deliveryHint: null,
      createdAt: null
    };
  }
}
