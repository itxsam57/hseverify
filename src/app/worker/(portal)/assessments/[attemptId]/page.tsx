import { notFound } from "next/navigation";

import { AssessmentWorkspace } from "@/components/worker/assessment-workspace";
import type { AssessmentAttemptClientView } from "@/lib/assessment-attempt/assessment-attempt-domain";
import {
  AssessmentAttemptAccessError,
  AssessmentAttemptInputError,
  getAssessmentAttemptService,
  type AssessmentAttemptView
} from "@/lib/assessment-attempt/assessment-attempt-service";
import { requirePlatformPermission } from "@/lib/authorization/authorization-service";

export const dynamic = "force-dynamic";

function toAssessmentAttemptClientView(
  view: AssessmentAttemptView
): AssessmentAttemptClientView {
  return Object.freeze({
    submitted: view.submitted,
    currentQuestion: view.currentQuestion
  });
}

export default async function AssessmentPage({
  params
}: {
  params: Promise<{ attemptId: string }>;
}): Promise<React.JSX.Element> {
  const principal = await requirePlatformPermission({
    expectedRole: "worker",
    permission: "worker.assessments.read"
  });
  const { attemptId } = await params;

  let view: AssessmentAttemptView;
  try {
    view = await (
      await getAssessmentAttemptService()
    ).getOwnedView(principal, attemptId);
  } catch (error) {
    if (
      error instanceof AssessmentAttemptAccessError ||
      error instanceof AssessmentAttemptInputError
    ) {
      notFound();
    }
    throw error;
  }

  return <AssessmentWorkspace view={toAssessmentAttemptClientView(view)} />;
}
