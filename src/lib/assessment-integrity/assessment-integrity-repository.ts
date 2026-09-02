import "server-only";

import type { DatabaseClient } from "../database/database";
import {
  isIntegrityClassification,
  isIntegrityEventSource,
  isIntegrityMonitoringState,
  isIntegritySessionStatus,
  isIntegritySignal,
  type IntegrityClassification,
  type IntegrityEventSource,
  type IntegrityMonitoringState,
  type IntegritySessionStatus,
  type IntegritySignal
} from "./assessment-integrity-domain";

export type IntegritySessionStored = Readonly<{
  integritySessionId: string;
  attemptId: string;
  workerAccountId: string;
  formId: string;
  policyVersion: string;
  status: IntegritySessionStatus;
  classification: IntegrityClassification;
  monitoringState: IntegrityMonitoringState;
  deviceBindingDigest: string;
  leaseDigest: string;
  leaseExpiresAt: string;
  startedAt: string;
  lastSeenAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type IntegrityEventStored = Readonly<{
  eventId: string;
  integritySessionId: string;
  attemptId: string;
  sequenceNo: number;
  idempotencyKey: string;
  payloadDigest: string;
  source: IntegrityEventSource;
  signal: IntegritySignal;
  observedAt: string | null;
  receivedAt: string;
  metadata: Readonly<Record<string, unknown>>;
}>;

type IntegritySessionRow = {
  integrity_session_id: string;
  attempt_id: string;
  worker_account_id: string;
  form_id: string;
  policy_version: string;
  status: string;
  classification: string;
  monitoring_state: string;
  device_binding_digest: string;
  lease_digest: string;
  lease_expires_at: string | Date;
  started_at: string | Date;
  last_seen_at: string | Date;
  ended_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type IntegrityEventRow = {
  event_id: string;
  integrity_session_id: string;
  attempt_id: string;
  sequence_no: number | string;
  idempotency_key: string;
  payload_digest: string;
  source: string;
  signal_key: string;
  observed_at: string | Date | null;
  received_at: string | Date;
  metadata_json: unknown;
};

const SESSION_COLUMNS = `integrity_session_id,attempt_id,worker_account_id,form_id,policy_version,
status,classification,monitoring_state,device_binding_digest,lease_digest,lease_expires_at,
started_at,last_seen_at,ended_at,created_at,updated_at`;
const EVENT_COLUMNS = `event_id,integrity_session_id,attempt_id,sequence_no,idempotency_key,
payload_digest,source,signal_key,observed_at,received_at,metadata_json`;

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function maybeIso(value: string | Date | null): string | null {
  return value === null ? null : iso(value);
}

function positiveInteger(value: number | string, label: string): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`Stored assessment integrity ${label} is invalid.`);
  }
  return parsed;
}

function metadata(value: unknown): Readonly<Record<string, unknown>> {
  let parsed = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error("Stored assessment integrity metadata is invalid.");
    }
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Stored assessment integrity metadata is invalid.");
  }
  return Object.freeze({ ...(parsed as Record<string, unknown>) });
}

function session(row: IntegritySessionRow): IntegritySessionStored {
  if (
    !isIntegritySessionStatus(row.status) ||
    !isIntegrityClassification(row.classification) ||
    !isIntegrityMonitoringState(row.monitoring_state)
  ) {
    throw new Error("Stored assessment integrity session state is invalid.");
  }
  return Object.freeze({
    integritySessionId: row.integrity_session_id,
    attemptId: row.attempt_id,
    workerAccountId: row.worker_account_id,
    formId: row.form_id,
    policyVersion: row.policy_version,
    status: row.status,
    classification: row.classification,
    monitoringState: row.monitoring_state,
    deviceBindingDigest: row.device_binding_digest,
    leaseDigest: row.lease_digest,
    leaseExpiresAt: iso(row.lease_expires_at),
    startedAt: iso(row.started_at),
    lastSeenAt: iso(row.last_seen_at),
    endedAt: maybeIso(row.ended_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  });
}

function event(row: IntegrityEventRow): IntegrityEventStored {
  if (!isIntegrityEventSource(row.source) || !isIntegritySignal(row.signal_key)) {
    throw new Error("Stored assessment integrity event vocabulary is invalid.");
  }
  return Object.freeze({
    eventId: row.event_id,
    integritySessionId: row.integrity_session_id,
    attemptId: row.attempt_id,
    sequenceNo: positiveInteger(row.sequence_no, "event sequence"),
    idempotencyKey: row.idempotency_key,
    payloadDigest: row.payload_digest,
    source: row.source,
    signal: row.signal_key,
    observedAt: maybeIso(row.observed_at),
    receivedAt: iso(row.received_at),
    metadata: metadata(row.metadata_json)
  });
}

export class AssessmentIntegrityRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByAttempt(attemptId: string): Promise<IntegritySessionStored | null> {
    const result = await this.database.query<IntegritySessionRow>(
      `SELECT ${SESSION_COLUMNS}
       FROM assessment_integrity_sessions
       WHERE attempt_id=$1
       LIMIT 1`,
      [attemptId]
    );
    return result.rows[0] ? session(result.rows[0]) : null;
  }

  async lockByAttemptOwned(
    workerAccountId: string,
    attemptId: string
  ): Promise<IntegritySessionStored | null> {
    const result = await this.database.query<IntegritySessionRow>(
      `SELECT ${SESSION_COLUMNS}
       FROM assessment_integrity_sessions
       WHERE attempt_id=$1 AND worker_account_id=$2
       FOR UPDATE`,
      [attemptId, workerAccountId]
    );
    return result.rows[0] ? session(result.rows[0]) : null;
  }

  async insertSession(input: {
    integritySessionId: string;
    attemptId: string;
    workerAccountId: string;
    formId: string;
    policyVersion: string;
    deviceBindingDigest: string;
    leaseDigest: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<IntegritySessionStored> {
    const result = await this.database.query<IntegritySessionRow>(
      `INSERT INTO assessment_integrity_sessions(
         integrity_session_id,attempt_id,worker_account_id,form_id,policy_version,status,
         classification,monitoring_state,device_binding_digest,lease_digest,lease_expires_at,
         started_at,last_seen_at,ended_at,created_at,updated_at
       ) VALUES($1,$2,$3,$4,$5,'ACTIVE','GREEN','NORMAL',$6,$7,$8,$9,$9,NULL,$9,$9)
       RETURNING ${SESSION_COLUMNS}`,
      [
        input.integritySessionId,
        input.attemptId,
        input.workerAccountId,
        input.formId,
        input.policyVersion,
        input.deviceBindingDigest,
        input.leaseDigest,
        input.leaseExpiresAt,
        input.now
      ]
    );
    if (!result.rows[0]) throw new Error("Assessment integrity session insert failed.");
    return session(result.rows[0]);
  }

  async rotateLease(input: {
    integritySessionId: string;
    workerAccountId: string;
    leaseDigest: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<IntegritySessionStored | null> {
    const result = await this.database.query<IntegritySessionRow>(
      `UPDATE assessment_integrity_sessions
       SET lease_digest=$3,lease_expires_at=$4,last_seen_at=$5,updated_at=$5
       WHERE integrity_session_id=$1
         AND worker_account_id=$2
         AND status='ACTIVE'
       RETURNING ${SESSION_COLUMNS}`,
      [
        input.integritySessionId,
        input.workerAccountId,
        input.leaseDigest,
        input.leaseExpiresAt,
        input.now
      ]
    );
    return result.rows[0] ? session(result.rows[0]) : null;
  }

  async touchLease(input: {
    integritySessionId: string;
    workerAccountId: string;
    leaseExpiresAt: string;
    now: string;
  }): Promise<IntegritySessionStored | null> {
    const result = await this.database.query<IntegritySessionRow>(
      `UPDATE assessment_integrity_sessions
       SET lease_expires_at=$3,last_seen_at=$4,updated_at=$4
       WHERE integrity_session_id=$1
         AND worker_account_id=$2
         AND status='ACTIVE'
       RETURNING ${SESSION_COLUMNS}`,
      [input.integritySessionId, input.workerAccountId, input.leaseExpiresAt, input.now]
    );
    return result.rows[0] ? session(result.rows[0]) : null;
  }

  async findEventByIdempotency(
    integritySessionId: string,
    idempotencyKey: string
  ): Promise<IntegrityEventStored | null> {
    const result = await this.database.query<IntegrityEventRow>(
      `SELECT ${EVENT_COLUMNS}
       FROM assessment_integrity_events
       WHERE integrity_session_id=$1 AND idempotency_key=$2
       LIMIT 1`,
      [integritySessionId, idempotencyKey]
    );
    return result.rows[0] ? event(result.rows[0]) : null;
  }

  async nextSequence(integritySessionId: string): Promise<number> {
    const result = await this.database.query<{ next_sequence: number | string }>(
      `SELECT COALESCE(MAX(sequence_no),0)+1 AS next_sequence
       FROM assessment_integrity_events
       WHERE integrity_session_id=$1`,
      [integritySessionId]
    );
    return positiveInteger(result.rows[0]?.next_sequence ?? 1, "next sequence");
  }

  async insertEvent(input: {
    eventId: string;
    integritySessionId: string;
    attemptId: string;
    sequenceNo: number;
    idempotencyKey: string;
    payloadDigest: string;
    source: IntegrityEventSource;
    signal: IntegritySignal;
    observedAt: string | null;
    receivedAt: string;
    metadata: Readonly<Record<string, unknown>>;
  }): Promise<IntegrityEventStored> {
    const result = await this.database.query<IntegrityEventRow>(
      `INSERT INTO assessment_integrity_events(
         event_id,integrity_session_id,attempt_id,sequence_no,idempotency_key,payload_digest,
         source,signal_key,observed_at,received_at,metadata_json
       ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb)
       RETURNING ${EVENT_COLUMNS}`,
      [
        input.eventId,
        input.integritySessionId,
        input.attemptId,
        input.sequenceNo,
        input.idempotencyKey,
        input.payloadDigest,
        input.source,
        input.signal,
        input.observedAt,
        input.receivedAt,
        JSON.stringify(input.metadata)
      ]
    );
    if (!result.rows[0]) throw new Error("Assessment integrity event insert failed.");
    return event(result.rows[0]);
  }

  async listEvents(integritySessionId: string): Promise<readonly IntegrityEventStored[]> {
    const result = await this.database.query<IntegrityEventRow>(
      `SELECT ${EVENT_COLUMNS}
       FROM assessment_integrity_events
       WHERE integrity_session_id=$1
       ORDER BY sequence_no ASC,event_id ASC`,
      [integritySessionId]
    );
    return Object.freeze(result.rows.map(event));
  }
}
