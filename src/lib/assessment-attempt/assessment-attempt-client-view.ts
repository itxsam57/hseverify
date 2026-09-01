import type { AssessmentAttemptDraftSnapshot } from "./assessment-attempt-draft-domain";
import type {
  AssessmentAttemptClientQuestion,
  AssessmentAttemptClientView
} from "./assessment-attempt-domain";

type AssessmentAttemptClientSource = Readonly<{
  currentQuestion: AssessmentAttemptClientQuestion | null;
  currentDraft: AssessmentAttemptDraftSnapshot | null;
  submitted: boolean;
}>;

function projectQuestion(
  question: AssessmentAttemptClientQuestion
): AssessmentAttemptClientQuestion {
  return Object.freeze({
    attemptId: question.attemptId,
    position: question.position,
    questionCount: question.questionCount,
    questionId: question.questionId,
    questionVersionId: question.questionVersionId,
    questionType: question.questionType,
    prompt: question.prompt,
    options: question.options === null ? null : Object.freeze([...question.options]),
    domainReference: question.domainReference,
    difficulty: question.difficulty,
    tags: Object.freeze([...question.tags])
  });
}

function projectDraft(
  draft: AssessmentAttemptDraftSnapshot
): AssessmentAttemptDraftSnapshot {
  return Object.freeze({
    value: draft.value,
    revision: draft.revision,
    updatedAt: draft.updatedAt
  });
}

export function toAssessmentAttemptClientView(
  view: AssessmentAttemptClientSource
): AssessmentAttemptClientView {
  return Object.freeze({
    currentQuestion:
      view.currentQuestion === null ? null : projectQuestion(view.currentQuestion),
    currentDraft: view.currentDraft === null ? null : projectDraft(view.currentDraft),
    submitted: view.submitted
  });
}
