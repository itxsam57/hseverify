"use server";

import { redirect } from "next/navigation";

import { requirePlatformPermission } from "@/lib/authorization/authorization-service";
import { getAssessmentAttemptService } from "@/lib/assessment-attempt/assessment-attempt-service";

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function beginAssessmentAction(formData: FormData): Promise<never> {
  const caseId = text(formData, "caseId");
  const catalogueVersionId = text(formData, "catalogueVersionId");
  const principal = await requirePlatformPermission({
    expectedRole: "worker",
    permission: "worker.assessments.read"
  });
  const result = await (
    await getAssessmentAttemptService()
  ).begin(principal, { caseId, catalogueVersionId });

  redirect(`/worker/assessments/${result.attempt.attemptId}`);
}
