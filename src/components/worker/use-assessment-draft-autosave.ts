"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  saveAssessmentDraftAction,
  type AssessmentDraftConflictSnapshot
} from "@/app/worker/(portal)/assessments/[attemptId]/actions";
import type {
  AssessmentAttemptClientDraft,
  AssessmentAttemptClientQuestion
} from "@/lib/assessment-attempt/assessment-attempt-domain";

type SaveRequest = Readonly<{
  editVersion: number;
  value: string;
  expectedRevision: number | null;
  mutationKey: string;
}>;

export type AssessmentDraftAutosaveConflict = Readonly<{
  message: string;
  serverDraft: AssessmentDraftConflictSnapshot | null;
}>;

export type AssessmentDraftAutosaveState = Readonly<{
  value: string;
  setValue: (value: string) => void;
  saveStatus: string;
  conflict: AssessmentDraftAutosaveConflict | null;
  useSavedVersion: () => void;
  replaceSavedVersion: () => void;
}>;

const DEBOUNCE_MS = 500;
const RETRY_MS = 1_500;

function initialEditValue(draft: AssessmentAttemptClientDraft | null): string {
  if (draft?.value === true) return "true";
  if (draft?.value === false) return "false";
  return typeof draft?.value === "string" ? draft.value : "";
}

function draftPayload(
  questionType: AssessmentAttemptClientQuestion["questionType"],
  value: string
): unknown {
  if (questionType === "TRUE_FALSE") {
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  }
  if (questionType === "MULTIPLE_CHOICE") {
    return value.length === 0 ? null : value;
  }
  return value;
}

function mutationKey(editVersion: number): string {
  return `m208-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${editVersion}`;
}

export function useAssessmentDraftAutosave(input: {
  question: AssessmentAttemptClientQuestion;
  initialDraft: AssessmentAttemptClientDraft | null;
}): AssessmentDraftAutosaveState {
  const { question, initialDraft } = input;
  const [value, setValueState] = useState(() => initialEditValue(initialDraft));
  const [saveStatus, setSaveStatus] = useState(initialDraft === null ? "Ready" : "Saved");
  const [conflict, setConflict] = useState<AssessmentDraftAutosaveConflict | null>(null);

  const currentValueRef = useRef(value);
  const revisionRef = useRef<number | null>(initialDraft?.revision ?? null);
  const editVersionRef = useRef(0);
  const inFlightRef = useRef<SaveRequest | null>(null);
  const retryPendingRef = useRef(false);
  const conflictRef = useRef<AssessmentDraftAutosaveConflict | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const sendRequestRef = useRef<(request: SaveRequest) => void>(() => undefined);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const makeRequest = useCallback(
    (
      requestValue: string,
      editVersion: number,
      expectedRevision: number | null = revisionRef.current
    ): SaveRequest =>
      Object.freeze({
        editVersion,
        value: requestValue,
        expectedRevision,
        mutationKey: mutationKey(editVersion)
      }),
    []
  );

  const queueLatest = useCallback(
    (delay = DEBOUNCE_MS) => {
      clearDebounce();
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (
          !mountedRef.current ||
          inFlightRef.current !== null ||
          retryPendingRef.current ||
          conflictRef.current !== null
        ) {
          return;
        }
        const request = makeRequest(currentValueRef.current, editVersionRef.current);
        sendRequestRef.current(request);
      }, delay);
    },
    [clearDebounce, makeRequest]
  );

  const transmit = useCallback(
    async (request: SaveRequest) => {
      if (!mountedRef.current || inFlightRef.current !== null) return;
      inFlightRef.current = request;
      clearRetry();

      const formData = new FormData();
      formData.set("attemptId", question.attemptId);
      formData.set("position", String(question.position));
      formData.set("questionVersionId", question.questionVersionId);
      formData.set("draftPayload", JSON.stringify(draftPayload(question.questionType, request.value)));
      formData.set(
        "expectedRevision",
        request.expectedRevision === null ? "" : String(request.expectedRevision)
      );
      formData.set("clientGeneratedMutationKey", request.mutationKey);

      try {
        const result = await saveAssessmentDraftAction(formData);
        if (!mountedRef.current) return;

        if (result.status === "saved") {
          retryPendingRef.current = false;
          revisionRef.current = result.revision;
          if (editVersionRef.current === request.editVersion) {
            setSaveStatus("Saved");
          } else {
            setSaveStatus("Saving…");
          }
          return;
        }

        if (result.status === "conflict") {
          retryPendingRef.current = false;
          const nextConflict = Object.freeze({
            message: result.message,
            serverDraft: result.serverDraft
          });
          conflictRef.current = nextConflict;
          setConflict(nextConflict);
          setSaveStatus("Conflict");
          return;
        }

        retryPendingRef.current = false;
        setSaveStatus(result.message);
      } catch {
        if (!mountedRef.current) return;
        retryPendingRef.current = true;
        setSaveStatus("Not saved — reconnecting");
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          if (!mountedRef.current) return;
          retryPendingRef.current = false;
          sendRequestRef.current(request);
        }, RETRY_MS);
      } finally {
        inFlightRef.current = null;
        if (
          mountedRef.current &&
          !retryPendingRef.current &&
          conflictRef.current === null &&
          editVersionRef.current !== request.editVersion
        ) {
          queueLatest(0);
        }
      }
    },
    [clearRetry, queueLatest, question]
  );

  sendRequestRef.current = (request: SaveRequest) => {
    void transmit(request);
  };

  const setValue = useCallback(
    (nextValue: string) => {
      currentValueRef.current = nextValue;
      editVersionRef.current += 1;
      conflictRef.current = null;
      setConflict(null);
      setValueState(nextValue);
      setSaveStatus("Saving…");
      queueLatest();
    },
    [queueLatest]
  );

  const useSavedVersion = useCallback(() => {
    const serverDraft = conflictRef.current?.serverDraft;
    if (!serverDraft) return;
    clearDebounce();
    clearRetry();
    retryPendingRef.current = false;
    revisionRef.current = serverDraft.revision;
    const savedValue =
      serverDraft.value === true
        ? "true"
        : serverDraft.value === false
          ? "false"
          : typeof serverDraft.value === "string"
            ? serverDraft.value
            : "";
    currentValueRef.current = savedValue;
    editVersionRef.current += 1;
    conflictRef.current = null;
    setConflict(null);
    setValueState(savedValue);
    setSaveStatus("Saved");
  }, [clearDebounce, clearRetry]);

  const replaceSavedVersion = useCallback(() => {
    const serverDraft = conflictRef.current?.serverDraft;
    if (!serverDraft || inFlightRef.current !== null) return;
    clearDebounce();
    clearRetry();
    retryPendingRef.current = false;
    revisionRef.current = serverDraft.revision;
    conflictRef.current = null;
    setConflict(null);
    setSaveStatus("Saving…");
    const request = makeRequest(
      currentValueRef.current,
      editVersionRef.current,
      serverDraft.revision
    );
    sendRequestRef.current(request);
  }, [clearDebounce, clearRetry, makeRequest]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearDebounce();
      clearRetry();
    };
  }, [clearDebounce, clearRetry]);

  return Object.freeze({
    value,
    setValue,
    saveStatus,
    conflict,
    useSavedVersion,
    replaceSavedVersion
  });
}
