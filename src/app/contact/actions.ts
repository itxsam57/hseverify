"use server";

import type { PublicConcernActionState } from "@/lib/public-verification/public-concern-action-state";
import { getPublicVerificationRequestRuntime } from "@/lib/public-verification/public-verification-runtime";

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function actionState(
  status: PublicConcernActionState["status"],
  message: string,
  concernReference: string | null = null
): PublicConcernActionState {
  return Object.freeze({ status, message, concernReference });
}

export async function submitPublicConcernAction(
  _previous: PublicConcernActionState,
  formData: FormData
): Promise<PublicConcernActionState> {
  try {
    const publicToken = formText(formData, "publicToken");
    const idempotencyNonce = formText(formData, "idempotencyNonce");
    const { service, requestFingerprint } =
      await getPublicVerificationRequestRuntime();

    const result = await service.submitPublicVerificationConcern({
      publicToken,
      requestFingerprint,
      category: formText(formData, "category"),
      description: formText(formData, "description"),
      contactName: formText(formData, "contactName"),
      contactEmail: formText(formData, "contactEmail"),
      contactPhone: formText(formData, "contactPhone"),
      idempotencyNonce
    });

    if (result.kind === "accepted") {
      return actionState(
        "success",
        "Your credential concern was received. Keep the reference below if you need to follow up.",
        result.concernReference
      );
    }
    if (result.kind === "validation_error") {
      return actionState("error", result.message);
    }
    if (result.status === "temporarily_unavailable") {
      return actionState(
        "error",
        "Concern reporting is temporarily unavailable. Wait a few minutes and try again."
      );
    }
    return actionState(
      "error",
      "The public verification reference is no longer available. Return to verification and check the identifier again."
    );
  } catch {
    return actionState(
      "error",
      "The concern could not be submitted safely. Wait a moment and try again."
    );
  }
}
