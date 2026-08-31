import { notFound } from "next/navigation";

import { AssessmentWorkspace } from "@/components/worker/assessment-workspace";
import {
  AssessmentAttemptAccessError,
  AssessmentAttemptInputError,
  getAssessmentAttemptService
} from "@/lib/assessment-attempt/assessment-attempt-service";
import { requirePlatformPermission } from "@/lib/authorization/authorization-service";

export const dynamic = "force-dynamic";

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

  try {
    const view = await (
      await getAssessmentAttemptService()
    ).getOwnedView(principal, attemptId);
    return <AssessmentWorkspace view={view} />;
  } catch (error) {
    if (
      error instanceof AssessmentAttemptAccessError ||
      error instanceof AssessmentAttemptInputError
    ) {
      notFound();
    }
    throw error;
  }
}
