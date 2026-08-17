"use server";

import { redirect } from "next/navigation";

import { getPublicVerificationRequestRuntime } from "@/lib/public-verification/public-verification-runtime";

export type PublicVerificationActionState = Readonly<{
  status: "idle" | "error" | "unavailable";
  message: string | null;
}>;

export const INITIAL_PUBLIC_VERIFICATION_ACTION_STATE: PublicVerificationActionState =
  Object.freeze({ status: "idle", message: null });

function state(
  status: Exclude<PublicVerificationActionState["status"], "idle">,
  message: string
): PublicVerificationActionState {
  return Object.freeze({ status, message });
}

export async function verifyPublicIdentifierAction(
  previousState: PublicVerificationActionState,
  formData: FormData
): Promise<PublicVerificationActionState> {
  void previousState;
  const raw = formData.get("identifier");
  const identifier = typeof raw === "string" ? raw : "";

  try {
    const { service, requestFingerprint } =
      await getPublicVerificationRequestRuntime();
    const result = await service.lookupPublicVerification({
      rawIdentifier: identifier,
      requestFingerprint
    });
    if (result.kind === "redirect") {
      redirect(`/verify/result/${encodeURIComponent(result.publicToken)}`);
    }
    if (result.status === "temporarily_unavailable") {
      return state(
        "unavailable",
        "Public verification is temporarily unavailable. Wait a few minutes and try again."
      );
    }
    return state(
      "error",
      "We could not verify that identifier. Check it and try again."
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "NEXT_REDIRECT"
    ) {
      throw error;
    }
    throw error;
  }
}