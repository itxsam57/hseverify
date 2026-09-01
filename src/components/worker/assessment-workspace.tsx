"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  saveAssessmentDraftAction,
  submitAssessmentAnswerAction,
  type AssessmentAnswerActionState,
  type AssessmentDraftActionState
} from "@/app/worker/(portal)/assessments/[attemptId]/actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import type { AssessmentAttemptClientView } from "@/lib/assessment-attempt/assessment-attempt-domain";
import type { AssessmentAttemptDraftValue } from "@/lib/assessment-attempt/assessment-attempt-draft-domain";

const INITIAL_STATE: AssessmentAnswerActionState = Object.freeze({
  status: "idle",
  message: ""
});

const INITIAL_DRAFT_STATE: AssessmentDraftActionState = Object.freeze({
  status: "idle",
  message: "",
  serverDraft: null
});

const AUTOSAVE_DELAY_MS = 650;
const RETRY_BASE_DELAY_MS = 1_500;
const RETRY_MAX_DELAY_MS = 10_000;
const SAVE_AND_EXIT_IN_FLIGHT_WAIT_MS = 10_000;
const EMERGENCY_EXIT_SAVE_WINDOW_MS = 900;

type AssessmentQuestion = NonNullable<AssessmentAttemptClientView["currentQuestion"]>;
type CurrentDraft = AssessmentAttemptClientView["currentDraft"];
type ServerDraft = NonNullable<AssessmentDraftActionState["serverDraft"]>;
type PersistenceKind = "idle" | "saving" | "saved" | "offline" | "conflict" | "error";
type PendingDraftRequest = Readonly<{
  editVersion: number;
  value: AssessmentAttemptDraftValue;
  expectedRevision: number | null;
  mutationKey: string;
}>;

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

function answerFromDraft(value: AssessmentAttemptDraftValue): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return value ?? "";
}

function draftFromAnswer(
  questionType: AssessmentQuestion["questionType"],
  value: string
): AssessmentAttemptDraftValue {
  if (questionType === "MULTIPLE_CHOICE") return value === "" ? null : value;
  if (questionType === "TRUE_FALSE") {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  }
  return value;
}

function AnswerControl({
  questionType,
  options,
  value,
  onChange,
  onBlur
}: {
  questionType: AssessmentQuestion["questionType"];
  options: readonly string[] | null;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}): React.JSX.Element {
  if (questionType === "MULTIPLE_CHOICE") {
    return (
      <fieldset className="content-stack" onBlur={onBlur}>
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
      <fieldset className="content-stack" onBlur={onBlur}>
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
          onBlur={onBlur}
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
          onBlur={onBlur}
        />
      </Field>
    );
  }

  if (questionType === "INTEGER") {
    return (
      <Field htmlFor="assessment-integer-answer" label="Your answer">
        <Input
          id="assessment-integer-answer"
          type="text"
          value={value}
          maxLength={128}
          onChange={(event) => onChange(event.currentTarget.value)}
          onBlur={onBlur}
          inputMode="numeric"
          autoComplete="off"
        />
      </Field>
    );
  }

  if (questionType === "DECIMAL") {
    return (
      <Field htmlFor="assessment-decimal-answer" label="Your answer">
        <Input
          id="assessment-decimal-answer"
          type="text"
          value={value}
          maxLength={128}
          onChange={(event) => onChange(event.currentTarget.value)}
          onBlur={onBlur}
          inputMode="decimal"
          autoComplete="off"
        />
      </Field>
    );
  }

  return <Alert tone="danger">This question type is unavailable.</Alert>;
}

function ActiveAssessmentQuestion({
  question,
  currentDraft
}: {
  question: AssessmentQuestion;
  currentDraft: CurrentDraft;
}): React.JSX.Element {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    submitAssessmentAnswerAction,
    INITIAL_STATE
  );
  const initialAnswer = answerFromDraft(currentDraft?.value ?? null);
  const [answer, setAnswer] = useState(initialAnswer);
  const [saveAndExitPending, setSaveAndExitPending] = useState(false);
  const [persistence, setPersistence] = useState<{
    kind: PersistenceKind;
    message: string;
  }>(() =>
    currentDraft
      ? { kind: "saved", message: "Saved" }
      : { kind: "idle", message: "Draft not saved yet." }
  );
  const [conflictSnapshot, setConflictSnapshot] = useState<ServerDraft | null>(null);

  const answerRef = useRef(initialAnswer);
  const revisionRef = useRef<number | null>(currentDraft?.revision ?? null);
  const editVersionRef = useRef(0);
  const acknowledgedEditVersionRef = useRef(0);
  const mutationSequenceRef = useRef(0);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);
  const pendingRequestRef = useRef<PendingDraftRequest | null>(null);
  const conflictActiveRef = useRef(false);
  const conflictSnapshotRef = useRef<ServerDraft | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current !== null) clearTimeout(debounceTimerRef.current);
      if (retryTimerRef.current !== null) clearTimeout(retryTimerRef.current);
    };
  }, []);

  function clearDebounce(): void {
    if (debounceTimerRef.current === null) return;
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = null;
  }

  function clearRetry(): void {
    if (retryTimerRef.current === null) return;
    clearTimeout(retryTimerRef.current);
    retryTimerRef.current = null;
  }

  function nextMutationKey(): string {
    mutationSequenceRef.current += 1;
    return `assessment-draft-${Date.now()}-${editVersionRef.current}-${mutationSequenceRef.current}-${crypto.randomUUID()}`;
  }

  function requestForLatestEdit(): PendingDraftRequest {
    return Object.freeze({
      editVersion: editVersionRef.current,
      value: draftFromAnswer(question.questionType, answerRef.current),
      expectedRevision: revisionRef.current,
      mutationKey: nextMutationKey()
    });
  }

  function scheduleRetry(request: PendingDraftRequest): void {
    clearRetry();
    retryAttemptRef.current += 1;
    const delay = Math.min(
      RETRY_BASE_DELAY_MS * 2 ** Math.min(retryAttemptRef.current - 1, 3),
      RETRY_MAX_DELAY_MS
    );
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      if (!mountedRef.current) return;
      if (pendingRequestRef.current?.mutationKey !== request.mutationKey) return;
      void runSave(request);
    }, delay);
  }

  async function runSave(request: PendingDraftRequest): Promise<void> {
    if (!mountedRef.current || inFlightRef.current || conflictActiveRef.current) return;
    inFlightRef.current = true;
    pendingRequestRef.current = request;
    clearRetry();

    const formData = new FormData();
    formData.set("attemptId", question.attemptId);
    formData.set("position", String(question.position));
    formData.set("questionVersionId", question.questionVersionId);
    formData.set("draft", JSON.stringify(request.value));
    formData.set(
      "expectedRevision",
      request.expectedRevision === null ? "" : String(request.expectedRevision)
    );
    formData.set("mutationKey", request.mutationKey);

    try {
      const result = await saveAssessmentDraftAction(INITIAL_DRAFT_STATE, formData);
      inFlightRef.current = false;
      if (!mountedRef.current) return;

      if (result.status === "saved") {
        if (!result.serverDraft) {
          pendingRequestRef.current = null;
          setPersistence({ kind: "error", message: "Not saved. Reload and try again." });
          return;
        }

        revisionRef.current = result.serverDraft.revision;
        acknowledgedEditVersionRef.current = request.editVersion;
        pendingRequestRef.current = null;
        retryAttemptRef.current = 0;
        const latestEdit = request.editVersion === editVersionRef.current;
        if (latestEdit) {
          queuedRef.current = false;
          setPersistence({ kind: "saved", message: "Saved" });
          return;
        }

        queuedRef.current = false;
        setPersistence({ kind: "saving", message: "Saving…" });
        void startLatestSave();
        return;
      }

      if (result.status === "conflict") {
        pendingRequestRef.current = null;
        queuedRef.current = false;
        conflictActiveRef.current = true;
        conflictSnapshotRef.current = result.serverDraft;
        setConflictSnapshot(result.serverDraft);
        setPersistence({ kind: "conflict", message: result.message });
        return;
      }

      pendingRequestRef.current = null;
      if (request.editVersion !== editVersionRef.current) {
        queuedRef.current = false;
        setPersistence({ kind: "saving", message: "Saving…" });
        void startLatestSave();
        return;
      }
      setPersistence({
        kind: "error",
        message: result.message ? `Not saved. ${result.message}` : "Not saved. Try again."
      });
    } catch {
      inFlightRef.current = false;
      if (!mountedRef.current) return;
      pendingRequestRef.current = request;
      setPersistence({ kind: "offline", message: "Not saved — reconnecting…" });
      scheduleRetry(request);
    }
  }

  function startLatestSave(): void {
    clearDebounce();
    if (!mountedRef.current || conflictActiveRef.current) return;
    if (editVersionRef.current === acknowledgedEditVersionRef.current) return;
    if (inFlightRef.current || pendingRequestRef.current !== null) {
      queuedRef.current = true;
      return;
    }
    queuedRef.current = false;
    void runSave(requestForLatestEdit());
  }

  function scheduleAutosave(): void {
    clearDebounce();
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      startLatestSave();
    }, AUTOSAVE_DELAY_MS);
  }

  function changeAnswer(nextAnswer: string): void {
    answerRef.current = nextAnswer;
    setAnswer(nextAnswer);
    editVersionRef.current += 1;
    if (conflictActiveRef.current) {
      setPersistence({
        kind: "conflict",
        message: "A saved version changed elsewhere. Choose which version to keep."
      });
      return;
    }
    setPersistence({ kind: "saving", message: "Saving…" });
    scheduleAutosave();
  }

  function flushAutosave(): void {
    if (conflictActiveRef.current) return;
    clearDebounce();
    startLatestSave();
  }

  function useSavedVersion(): void {
    const saved = conflictSnapshotRef.current;
    if (!saved) return;
    clearDebounce();
    clearRetry();
    const restored = answerFromDraft(saved.value);
    answerRef.current = restored;
    setAnswer(restored);
    revisionRef.current = saved.revision;
    editVersionRef.current += 1;
    acknowledgedEditVersionRef.current = editVersionRef.current;
    pendingRequestRef.current = null;
    queuedRef.current = false;
    conflictActiveRef.current = false;
    conflictSnapshotRef.current = null;
    setConflictSnapshot(null);
    setPersistence({ kind: "saved", message: "Saved" });
  }

  function replaceSavedVersionWithThisTab(): void {
    const saved = conflictSnapshotRef.current;
    if (!saved) return;
    clearDebounce();
    clearRetry();
    revisionRef.current = saved.revision;
    pendingRequestRef.current = null;
    queuedRef.current = false;
    conflictActiveRef.current = false;
    conflictSnapshotRef.current = null;
    setConflictSnapshot(null);
    editVersionRef.current += 1;
    setPersistence({ kind: "saving", message: "Saving…" });
    startLatestSave();
  }

  async function waitForInFlightSave(timeoutMs: number): Promise<boolean> {
    const startedAt = Date.now();
    while (inFlightRef.current && Date.now() - startedAt < timeoutMs) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
    }
    return !inFlightRef.current;
  }

  async function flushCurrentEditForExit(): Promise<boolean> {
    clearDebounce();
    clearRetry();
    if (conflictActiveRef.current) {
      setPersistence({
        kind: "conflict",
        message: "Not saved. Resolve the saved-version conflict before leaving this page."
      });
      return false;
    }

    const settled = await waitForInFlightSave(SAVE_AND_EXIT_IN_FLIGHT_WAIT_MS);
    if (!settled) {
      setPersistence({ kind: "error", message: "Not saved. Stay on this page and try again." });
      return false;
    }

    const targetEditVersion = editVersionRef.current;
    if (acknowledgedEditVersionRef.current === targetEditVersion) return true;

    const pendingRequest = pendingRequestRef.current;
    const request =
      pendingRequest?.editVersion === targetEditVersion
        ? pendingRequest
        : requestForLatestEdit();

    setPersistence({ kind: "saving", message: "Saving…" });
    await runSave(request);

    if (
      acknowledgedEditVersionRef.current === targetEditVersion &&
      editVersionRef.current === targetEditVersion
    ) {
      return true;
    }

    if (!conflictActiveRef.current) {
      setPersistence({ kind: "error", message: "Not saved. Stay on this page and try again." });
    }
    return false;
  }

  async function saveAndExit(): Promise<void> {
    if (saveAndExitPending) return;
    setSaveAndExitPending(true);
    const saved = await flushCurrentEditForExit();
    if (saved) {
      router.push("/worker/available-assessments");
      return;
    }
    if (mountedRef.current) setSaveAndExitPending(false);
  }

  async function emergencyExit(): Promise<void> {
    clearDebounce();
    clearRetry();

    const currentEditVersion = editVersionRef.current;
    const alreadySaved = acknowledgedEditVersionRef.current === currentEditVersion;
    const pendingRequest = pendingRequestRef.current;
    const request =
      pendingRequest?.editVersion === currentEditVersion
        ? pendingRequest
        : requestForLatestEdit();
    const bestEffortSave =
      alreadySaved || conflictActiveRef.current
        ? Promise.resolve()
        : runSave(request);

    await Promise.race([
      bestEffortSave,
      new Promise<void>((resolve) => {
        setTimeout(resolve, EMERGENCY_EXIT_SAVE_WINDOW_MS);
      })
    ]);
    router.push("/worker/available-assessments");
  }

  const persistenceTone =
    persistence.kind === "conflict"
      ? "warning"
      : persistence.kind === "error" || persistence.kind === "offline"
        ? "danger"
        : "success";

  return (
    <section className="panel page-section content-stack" aria-labelledby="current-question-heading">
      <div>
        <p className="eyebrow">{question.domainReference} · {question.difficulty}</p>
        <h2 id="current-question-heading">Question {question.position}</h2>
        <p>{question.prompt}</p>
      </div>

      <Alert tone={persistenceTone} role="status">
        <span aria-live="polite">{persistence.message}</span>
      </Alert>

      {persistence.kind === "conflict" && conflictSnapshot ? (
        <div className="content-stack" aria-label="Resolve saved draft conflict">
          <p>
            This tab and the saved draft changed independently. Nothing will be overwritten until you choose.
          </p>
          <div className="button-row">
            <Button type="button" onClick={useSavedVersion}>
              Use saved version
            </Button>
            <Button type="button" onClick={replaceSavedVersionWithThisTab}>
              Replace saved version with this tab
            </Button>
          </div>
        </div>
      ) : null}

      {state.message ? (
        <Alert tone={state.status === "conflict" ? "warning" : "danger"} role="status">
          {state.message}
        </Alert>
      ) : null}

      <form action={action} className="content-stack">
        <input type="hidden" name="attemptId" value={question.attemptId} />
        <input type="hidden" name="position" value={String(question.position)} />
        <input type="hidden" name="questionVersionId" value={question.questionVersionId} />
        <input type="hidden" name="answer" value={encodeAnswer(question.questionType, answer)} />

        <AnswerControl
          questionType={question.questionType}
          options={question.options}
          value={answer}
          onChange={changeAnswer}
          onBlur={flushAutosave}
        />

        <Button type="submit" disabled={pending}>
          {pending
            ? "Submitting…"
            : question.position === question.questionCount
              ? "Submit assessment"
              : "Next"}
        </Button>
      </form>

      <div className="content-stack" aria-label="Assessment exit controls">
        <div className="button-row">
          <Button
            type="button"
            variant="secondary"
            disabled={saveAndExitPending}
            onClick={() => void saveAndExit()}
          >
            {saveAndExitPending ? "Saving before exit…" : "Save and exit"}
          </Button>
          <Button type="button" variant="danger" onClick={() => void emergencyExit()}>
            Emergency exit
          </Button>
        </div>
        <p className="muted-copy">
          Save and exit waits for this exact edit to be confirmed before leaving. Emergency exit leaves
          after a short best-effort save window; only the last server-confirmed Saved version is guaranteed recoverable.
        </p>
      </div>
    </section>
  );
}

export function AssessmentWorkspace({
  view
}: {
  view: AssessmentAttemptClientView;
}): React.JSX.Element {
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

      <ActiveAssessmentQuestion
        key={`${question.attemptId}:${question.position}:${question.questionVersionId}`}
        question={question}
        currentDraft={view.currentDraft}
      />
    </section>
  );
}
