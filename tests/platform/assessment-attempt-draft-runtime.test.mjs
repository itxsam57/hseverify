import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { openScriptDatabase } from "../../scripts/lib/database.mjs";
import { applyMigrationsThrough } from "../helpers/migration-ceiling.mjs";
import {
  ATTEMPT_NOW,
  seedInProgressAttempt,
  seedWorkerPrincipal
} from "../helpers/assessment-attempt-fixture.mjs";

const runtime = process.env.HSE_ASSESSMENT_ATTEMPT_DRAFT_REPOSITORY_RUNTIME_DIST;
assert.ok(runtime, "HSE_ASSESSMENT_ATTEMPT_DRAFT_REPOSITORY_RUNTIME_DIST is required");
const repositoryModule = await import(
  pathToFileURL(join(runtime, "assessment-attempt", "assessment-attempt-repository.js")).href
);
const { AssessmentAttemptRepository } = repositoryModule;

const ENV = {
  appEnvironment: "test",
  databaseDriver: "pglite",
  databaseUrl: null,
  pgliteDataDir: "memory://",
  releaseSha: "m2-08-draft-repository-runtime",
  sessionSecret: "m2-08-draft-repository-session-secret-more-than-thirty-two-characters",
  authPepper: "m2-08-draft-repository-auth-pepper-more-than-thirty-two-characters",
  authSandboxEnabled: false,
  authSandboxAccessKey: null,
  demoAuthEnabled: false,
  demoDataEnabled: false
};

async function database() {
  const db = await openScriptDatabase(ENV);
  await applyMigrationsThrough(db, ENV.releaseSha, "0043_assessment_attempt_drafts");
  return db;
}

async function context(db, seed, question = { questionType: "SHORT_TEXT" }) {
  const principal = await seedWorkerPrincipal(db, seed);
  const fixture = await seedInProgressAttempt(db, principal, seed, [question]);
  const repository = new AssessmentAttemptRepository(db);
  const attempt = await repository.findOwned(principal.accountId, fixture.attemptId);
  const item = await repository.loadCurrentPinnedItem(principal.accountId, fixture.attemptId);
  assert.ok(attempt);
  assert.ok(item);
  return { principal, fixture, repository, attempt, item };
}

async function storedDraft(db, attemptId) {
  const result = await db.query(
    `SELECT revision,text_value,boolean_value,latest_mutation_key,latest_mutation_digest
     FROM assessment_attempt_drafts
     WHERE attempt_id=$1`,
    [attemptId]
  );
  return result.rows[0] ?? null;
}

function assertSafeSnapshot(snapshot) {
  assert.ok(snapshot);
  const serializedKeys = Object.keys(snapshot).join(" ").toLowerCase();
  assert.equal(serializedKeys.includes("digest"), false);
  assert.equal(serializedKeys.includes("mutation"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot, "latestMutationDigest"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot, "latestMutationKey"), false);
}

test("repository draft CAS supports first write, update, exact retry, stale rejection, clearing, and exact deletion", async () => {
  const db = await database();
  try {
    const { fixture, repository, attempt, item } = await context(db, "draft-cas");

    assert.equal(await repository.findCurrentDraft(attempt.attemptId, item.formItemId), null);

    const first = await repository.saveCurrentDraftCompareAndSwap({
      attempt,
      item,
      value: "  first editable value  ",
      expectedRevision: null,
      mutationKey: "draft-cas-mutation-1",
      now: ATTEMPT_NOW
    });
    assertSafeSnapshot(first);
    assert.equal(first.revision, 1);
    assert.equal(first.value, "  first editable value  ");

    const firstStored = await storedDraft(db, attempt.attemptId);
    assert.ok(firstStored);
    assert.equal(Number(firstStored.revision), 1);
    assert.equal(firstStored.text_value, "  first editable value  ");
    assert.equal(firstStored.latest_mutation_key, "draft-cas-mutation-1");
    assert.match(String(firstStored.latest_mutation_digest), /^[0-9a-f]{64}$/);

    const cleared = await repository.saveCurrentDraftCompareAndSwap({
      attempt,
      item,
      value: "",
      expectedRevision: 1,
      mutationKey: "draft-cas-mutation-2",
      now: ATTEMPT_NOW
    });
    assert.equal(cleared.revision, 2);
    assert.equal(cleared.value, "");

    const exactRetry = await repository.saveCurrentDraftCompareAndSwap({
      attempt,
      item,
      value: "",
      expectedRevision: 1,
      mutationKey: "draft-cas-mutation-2",
      now: ATTEMPT_NOW
    });
    assert.equal(exactRetry.revision, 2);
    assert.equal(exactRetry.value, "");
    assert.equal(Number((await storedDraft(db, attempt.attemptId)).revision), 2);

    await assert.rejects(
      repository.saveCurrentDraftCompareAndSwap({
        attempt,
        item,
        value: "different payload with reused key",
        expectedRevision: 2,
        mutationKey: "draft-cas-mutation-2",
        now: ATTEMPT_NOW
      })
    );
    assert.equal((await storedDraft(db, attempt.attemptId)).text_value, "");

    await assert.rejects(
      repository.saveCurrentDraftCompareAndSwap({
        attempt,
        item,
        value: "stale writer",
        expectedRevision: 1,
        mutationKey: "draft-cas-mutation-3",
        now: ATTEMPT_NOW
      })
    );
    assert.equal((await storedDraft(db, attempt.attemptId)).text_value, "");
    assert.equal(Number((await storedDraft(db, attempt.attemptId)).revision), 2);

    const loaded = await repository.findCurrentDraft(attempt.attemptId, item.formItemId);
    assertSafeSnapshot(loaded);
    assert.equal(loaded.revision, 2);
    assert.equal(loaded.value, "");

    await repository.deleteCurrentDraft({
      attemptId: attempt.attemptId,
      formItemId: "assessment_form_item_wrongwrongwrongwrong",
      position: item.position
    });
    assert.ok(await repository.findCurrentDraft(attempt.attemptId, item.formItemId));

    await repository.deleteCurrentDraft({
      attemptId: attempt.attemptId,
      formItemId: item.formItemId,
      position: item.position
    });
    assert.equal(await repository.findCurrentDraft(attempt.attemptId, item.formItemId), null);
    assert.equal(await storedDraft(db, attempt.attemptId), null);
    assert.equal(fixture.items[0].formItemId, item.formItemId);
  } finally {
    await db.close();
  }
});

test("repository draft projection round-trips nullable true/false selection without exposing server digest", async () => {
  const db = await database();
  try {
    const { repository, attempt, item } = await context(db, "draft-boolean", {
      questionType: "TRUE_FALSE"
    });

    const selected = await repository.saveCurrentDraftCompareAndSwap({
      attempt,
      item,
      value: false,
      expectedRevision: null,
      mutationKey: "draft-boolean-mutation-1",
      now: ATTEMPT_NOW
    });
    assert.equal(selected.value, false);
    assert.equal(selected.revision, 1);

    const cleared = await repository.saveCurrentDraftCompareAndSwap({
      attempt,
      item,
      value: null,
      expectedRevision: 1,
      mutationKey: "draft-boolean-mutation-2",
      now: ATTEMPT_NOW
    });
    assert.equal(cleared.value, null);
    assert.equal(cleared.revision, 2);
    assertSafeSnapshot(cleared);

    const stored = await storedDraft(db, attempt.attemptId);
    assert.equal(stored.text_value, null);
    assert.equal(stored.boolean_value, null);
  } finally {
    await db.close();
  }
});
