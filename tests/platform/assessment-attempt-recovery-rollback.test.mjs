import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-recovery-rollback-runtime",
  sessionSecret: "m2-08-recovery-rollback-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-recovery-rollback-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function relationExists(db, relation) {
  const result = await db.query(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${relation}`]
  );
  return result.rows[0]?.exists === true;
}

async function columnExists(db, table, column) {
  const result = await db.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
     ) AS exists`,
    [table, column]
  );
  return result.rows[0]?.exists === true;
}

async function auditActionConstraintDefinition(db) {
  const result = await db.query(
    `SELECT pg_get_constraintdef(oid) AS definition
     FROM pg_constraint
     WHERE conname='platform_audit_events_action_key_check'`
  );
  assert.equal(result.rows.length, 1);
  return String(result.rows[0].definition);
}

async function insertAuditEvent(db, auditEventId, actionKey) {
  await db.query(
    `INSERT INTO platform_audit_events (
       audit_event_id,source_kind,action_key,outcome,target_type,target_reference,metadata
     ) VALUES ($1,'native',$2,'succeeded','resource',$3,'{}'::jsonb)`,
    [auditEventId, actionKey, auditEventId]
  );
}

test("M2.08 clean down removes only recovery-owned schema, preserves history, and reapply restores recovery contract", async () => {
  const db = await openScriptDatabase(ENV);
  try {
    await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_recovery");

    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
    assert.equal(await relationExists(db, "assessment_attempt_drafts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_interruptions"), true);
    assert.equal(await relationExists(db, "assessment_technical_issue_reports"), true);
    assert.equal(await relationExists(db, "assessment_attempt_recovery_lineage"), true);
    assert.equal(
      await columnExists(db, "generated_assessment_forms", "recovery_source_attempt_id"),
      true
    );

    const m208Constraint = await auditActionConstraintDefinition(db);
    assert.match(m208Constraint, /assessment\.attempt\.interrupted/);
    assert.match(m208Constraint, /assessment\.attempt\.replacement\.created/);
    assert.match(m208Constraint, /assessment\.attempt\.submitted/);

    await insertAuditEvent(
      db,
      "audit_m208_rollback_history",
      "assessment.attempt.interrupted"
    );

    const down = await readFile(
      resolve("database/migrations/0043_assessment_attempt_recovery.down.sql"),
      "utf8"
    );
    const up = await readFile(
      resolve("database/migrations/0043_assessment_attempt_recovery.up.sql"),
      "utf8"
    );

    await db.execute(down);

    assert.equal(await relationExists(db, "assessment_attempts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_answers"), true);
    assert.equal(await relationExists(db, "generated_assessment_forms"), true);
    assert.equal(await relationExists(db, "generated_assessment_form_items"), true);
    assert.equal(await relationExists(db, "assessment_attempt_drafts"), false);
    assert.equal(await relationExists(db, "assessment_attempt_interruptions"), false);
    assert.equal(await relationExists(db, "assessment_technical_issue_reports"), false);
    assert.equal(await relationExists(db, "assessment_attempt_recovery_lineage"), false);
    assert.equal(
      await columnExists(db, "generated_assessment_forms", "recovery_source_attempt_id"),
      false
    );

    const rolledBackConstraint = await auditActionConstraintDefinition(db);
    assert.doesNotMatch(rolledBackConstraint, /assessment\.attempt\.interrupted/);
    assert.match(rolledBackConstraint, /assessment\.attempt\.submitted/);

    const preservedHistory = await db.query(
      `SELECT action_key FROM platform_audit_events WHERE audit_event_id='audit_m208_rollback_history'`
    );
    assert.deepEqual(preservedHistory.rows, [
      { action_key: "assessment.attempt.interrupted" }
    ]);

    await assert.rejects(
      () =>
        insertAuditEvent(
          db,
          "audit_m208_rollback_new_event",
          "assessment.attempt.interrupted"
        ),
      /check constraint|violates/i
    );

    await db.execute(up);
    assert.equal(await relationExists(db, "assessment_attempt_drafts"), true);
    assert.equal(await relationExists(db, "assessment_attempt_interruptions"), true);
    assert.equal(await relationExists(db, "assessment_technical_issue_reports"), true);
    assert.equal(await relationExists(db, "assessment_attempt_recovery_lineage"), true);
    assert.equal(
      await columnExists(db, "generated_assessment_forms", "recovery_source_attempt_id"),
      true
    );

    const reappliedConstraint = await auditActionConstraintDefinition(db);
    assert.match(reappliedConstraint, /assessment\.attempt\.interrupted/);
    assert.match(reappliedConstraint, /assessment\.attempt\.submitted/);
  } finally {
    await db.close();
  }
});
