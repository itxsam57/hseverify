"use client";

import { useActionState, useState } from "react";

import {
  submitAssessmentAnswerAction,
  type AssessmentAnswerActionState
} from "@/app/worker/(portal)/assessments/[attemptId]/actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { AssessmentAttemptClientView } from "@/lib/assessment-attempt/assessment-attempt-domain";

const INITIAL_STATE: AssessmentAnswerActionState = Object.freeze({
  status: "idle",
  message: ""
});

function encodeAnswer(questionType: string, value: string): string {
  if (questionType === "TRUE_FALSE") {
    if (value === "true") return "true";
    if (value === "false") return "false";
    return JSON.stringify(value);
  }
  if (questionType === "INTEGER" || questionType === "DECIMAL") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) return JSON.stringify(numeric);
    }
  }
  return JSON.stringify(value);
}

function AnswerControl({
  questionType,
  options,
  value,
  onChange
}: {
  questionType: NonNullable<AssessmentAttemptClientView["currentQuestion"]>["questionType"];
  options: readonly string[] | null;
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  if (questionType === "MULTIPLE_CHOICE") {
    return (
      <fieldset className="content-stack">
        <legend>Choose one answer</legend>
        {(options ?? []).map((option) => (
          <label className="ds-checkbox-field" key={option}>
            <input
              type="radio"
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (questionType === "TRUE_FALSE") {
    return (
      <fieldset className="content-stack">
        <legend>Choose true or false</legend>
        {[
          ["true", "True"],
          ["false", "False"]
        ].map(([optionValue, label]) => (
          <label className="ds-checkbox-field" key={optionValue}>
            <input
              type="radio"
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (questionType === "SHORT_TEXT") {
    return (
      <Field htmlFor="assessment-short-answer" label="Your answer">
        <Input
          id="assessment-short-answer"
          type="text"
          value={value}
          maxLength={2000}
          onChange={(event) => onChange(event.currentTarget.value)}
          autoComplete="off"
        />
      </Field>
    );
  }

  if (questionType === "LONG_TEXT") {
    return (
      <Field htmlFor="assessment-long-answer" label="Your answer">
        <Textarea
          id="assessment-long-answer"
          value={value}
          maxLength={20000}
          rows={10}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </Field>
    );
  }

  if (questionType === "INTEGER") {
    return (
      <Field htmlFor="assessment-integer-answer" label="Your answer">
        <Input
          id="assessment-integer-answer"
          type="number"
          step="1"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          inputMode="numeric"
        />
      </Field>
    );
  }

  if (questionType === "DECIMAL") {
    return (
      <Field htmlFor="assessment-decimal-answer" label="Your answer">
        <Input
          id="assessment-decimal-answer"
          type="number"
          step="any"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          inputMode="decimal"
        />
      </Field>
    );
  }

  return <Alert tone="danger">This question type is unavailable.</Alert>;
}

export function AssessmentWorkspace({
  view
}: {
  view: AssessmentAttemptClientView;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(
    submitAssessmentAnswerAction,
    INITIAL_STATE
  );
  const [answer, setAnswer] = useState("");

  if (view.submitted) {
    return (
      <section className="page-stack" aria-labelledby="assessment-heading">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Assessment submitted</p>
            <h1 id="assessment-heading">Assessment</h1>
            <p>Your responses have been submitted. Results are not calculated in this assessment window.</p>
          </div>
        </div>
        <Alert tone="success" role="status">
          Submission received. You may leave this page safely.
        </Alert>
      </section>
    );
  }

  const question = view.currentQuestion;
  if (!question) {
    return (
      <section className="page-stack" aria-labelledby="assessment-heading">
        <h1 id="assessment-heading">Assessment</h1>
        <Alert tone="danger">The current question is unavailable.</Alert>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="assessment-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Candidate assessment</p>
          <h1 id="assessment-heading">Assessment</h1>
          <p>Question {question.position} of {question.questionCount}</p>
        </div>
      </div>

      <section className="panel page-section content-stack" aria-labelledby="current-question-heading">
        <div>
          <p className="eyebrow">{question.domainReference} · {question.difficulty}</p>
          <h2 id="current-question-heading">Question {question.position}</h2>
          <p>{question.prompt}</p>
        </div>

        {state.message ? (
          <Alert tone={state.status === "conflict" ? "warning" : "danger"} role="status">
            {state.message}
          </Alert>
        ) : (
          <div role="status" aria-live="polite" className="sr-only">
            Ready for your answer.
          </div>
        )}

        <form action={action} className="content-stack">
          <input type="hidden" name="attemptId" value={question.attemptId} />
          <input type="hidden" name="position" value={String(question.position)} />
          <input type="hidden" name="questionVersionId" value={question.questionVersionId} />
          <input type="hidden" name="answer" value={encodeAnswer(question.questionType, answer)} />

          <AnswerControl
            questionType={question.questionType}
            options={question.options}
            value={answer}
            onChange={setAnswer}
          />

          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving…"
              : question.position === question.questionCount
                ? "Submit assessment"
                : "Next"}
          </Button>
        </form>
      </section>
    </section>
  );
}
