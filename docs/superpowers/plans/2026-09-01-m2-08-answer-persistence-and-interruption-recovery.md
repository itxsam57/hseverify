# M2.08 Answer Persistence and Interruption Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the active Worker assessment recover the exact current uncommitted answer through reloads, crashes, connectivity loss, explicit interruption, and controlled recovery without ever turning autosave into answer submission or weakening M2.07's immutable one-question-at-a-time contract.

**Architecture:** Extend the accepted M2.07 attempt boundary with a separate mutable server draft, a server-owned interruption/recovery lifecycle, and a browser-only AES-GCM safety buffer. Server draft revisions use compare-and-swap plus latest-mutation idempotency; `Next`/final `Submit assessment` remain the only immutable commit path. Same-form recovery is the default, while exceptional replacement creates a new immutable form/attempt linked to the predecessor and preserves the existing global Worker/question non-repeat invariant.

**Tech Stack:** Next.js 16 App Router/server actions, React 19, TypeScript strict mode, PostgreSQL/PGlite migrations, native Node crypto, Web Crypto AES-GCM, IndexedDB structured cloning, Node `node:test`, Playwright Chromium, existing Engineering Gate and permanent Independent full-system audit.

**Spec:** `docs/superpowers/specs/2026-09-01-m2-08-answer-persistence-and-interruption-recovery-design.md`

## Global Constraints

- The approved design baseline is verified `main` commit `768169e94831dbf29cb0335f11148ffb9dc79b92`; before implementation, land this approved spec/plan branch into `main`, re-verify the resulting exact `main` head, and create `feat/m2-08-answer-recovery` from that verified head. Do not implement from the documentation branch.
- M2.08 extends accepted M2.07 behavior; `assessment_attempt_answers` stays append-only and is never used as an autosave table.
- The attempt lifecycle becomes exactly `IN_PROGRESS -> INTERRUPTED -> RECOVERABLE -> IN_PROGRESS`, with `SUBMITTED` terminal. A normal reload/crash/network loss does not fabricate `INTERRUPTED` when the server received no explicit interruption event.
- Supported question types remain exactly `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_TEXT`, `LONG_TEXT`, `INTEGER`, `DECIMAL`.
- Draft-form input is intentionally broader than committed-answer input: cleared/unselected state, exact text whitespace, and partial numeric strings such as `-`, `.`, and `1.` must persist without becoming valid committed answers.
- `Next` and final `Submit assessment` remain the only answer-commit operations. There is still no Previous control, backtracking, or committed-answer mutation.
- Browser-supplied Worker IDs, form IDs, form-item IDs, arbitrary question IDs, lifecycle states, replacement reasons, and recovery authority are forbidden. Worker identity and authoritative lineage come only from the trusted live authorization principal and locked server state.
- Only a live active `worker` principal with `worker.assessments.read` may read/save/commit/interrupt/report/recover an assessment. Expired/revoked sessions and every non-Worker role fail closed.
- No M2.08 response, HTML, browser state, local recovery record, audit event, timeline event, log message, technical-issue metadata, or error may add future questions/form arrays, answer keys, rubrics, correctness, scoring/pass-fail, or reviewer-only data.
- Draft/answer content, technical-issue free text, local ciphertext, and CryptoKey material never enter generic audit/timeline metadata or routine logs. Routine autosaves do not flood the audit ledger.
- The browser safety buffer uses only native Web Crypto AES-GCM plus IndexedDB; do not add a client encryption/storage dependency. The key is non-exportable and stored via structured clone. No credential/session token is persisted in recovery storage.
- Save-state copy is truthful: `Saving…` while server sync is pending, `Saved` only after the current revision is accepted by the server, and `Offline — saved on this device` only after encrypted local persistence succeeds while server sync is unavailable.
- Same-form recovery preserves the same attempt/form/position/current pinned question and committed answers. Exceptional replacement is server-controlled only, never a Worker-selected retake.
- Existing global `UNIQUE(worker_account_id, question_id)` exposure history remains stronger than the minimum recovery exclusion rule and must not be removed or weakened.
- M2.08 does not implement webcam/microphone/screen capture, anti-cheat/integrity scoring, assessment scoring/pass-fail, written-answer reviewer workflow, or result publication. Those remain M2.09/M2.10 or later.
- Strict RED -> GREEN -> REFACTOR applies. Every production migration/service/UI/workflow change begins with an automated test that fails for the expected missing-behavior reason.
- Existing M2.07 targeted tests, M2.07 real-browser QA, committed-answer append-only protections, full Engineering Gate, and permanent Independent full-system audit remain mandatory regression gates.

## Implementation File Map

- `database/migrations/0043_assessment_attempt_recovery.up.sql` / `.down.sql`: lifecycle expansion, server draft integrity, interruption/report records, recovery lineage, generated-form recovery identity, audit vocabulary, rollback/reapply contract.
- `src/lib/assessment-attempt/assessment-attempt-domain.ts`: extend the existing attempt status type only; committed-answer normalization remains unchanged.
- `src/lib/assessment-attempt/assessment-attempt-recovery-domain.ts`: draft-form values, revisions/mutation keys, interruption/report/replacement reason enums, safe snapshots, client action result types, recovery errors, ID/reference validation.
- `src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts`: mutable draft CAS storage, interruption/report persistence, recovery-lineage reads/writes, lifecycle conditional transitions, supersession checks.
- `src/lib/assessment-attempt/assessment-attempt-recovery-service.ts`: live-Worker authorization reuse, draft autosave, interruption, recovery eligibility/resume, technical reports, exceptional replacement orchestration, safe audit/timeline evidence.
- `src/lib/assessment-attempt/assessment-attempt-repository.ts`: preserve M2.07 committed-answer API while adding current-draft deletion hooks and successor-safe attempt creation/lookup behavior.
- `src/lib/assessment-attempt/assessment-attempt-service.ts`: keep begin/commit ownership; consume/delete matching draft transactionally and refuse progression of interrupted/recoverable/superseded predecessors.
- `src/lib/assessment-attempt/assessment-attempt-client-view.ts`: project lifecycle/current server draft/replacement link without exposing server-only attempt internals or forbidden assessment data.
- `src/lib/assessment-attempt/assessment-recovery-owner.ts`: server-only stable opaque owner-handle derivation used to scope browser recovery records without exposing raw account identity.
- `src/lib/assessment-attempt/assessment-recovery-local-store.ts`: browser-only IndexedDB + AES-GCM key/ciphertext/pending-operation persistence and cleanup.
- `src/lib/assessment-generation/assessment-form-generation-service.ts`: preserve normal one-form generation while adding an explicit recovery-form path keyed by predecessor attempt and using the unchanged global unseen-question pool.
- `src/app/worker/(portal)/assessments/[attemptId]/actions.ts`: coarse server-action adapters for save, commit, interrupt, report, establish recovery eligibility, and resume.
- `src/app/worker/(portal)/assessments/[attemptId]/page.tsx`: authenticated recovery-aware projection; GET stays read-only and never creates interruption/replacement state.
- `src/components/worker/assessment-workspace.tsx`: one-question UI, exact string-preserving draft controls, truthful save status, commit button separation.
- `src/components/worker/use-assessment-draft-recovery.ts`: local-first/debounced-server autosave, reconnect flush, stale conflict arbitration, queued offline operation retry.
- `src/components/worker/assessment-recovery-controls.tsx`: conflict choice, Emergency Exit, technical-issue report, interrupted/recoverable/superseded states.
- `src/components/auth/assessment-recovery-sign-out.tsx` + `src/components/auth/role-portal-shell.tsx`: clear the current Worker's local recovery material on explicit logout without changing server session-revocation semantics for any role.
- `scripts/check-assessment-attempt-recovery.mjs`, `scripts/run-assessment-attempt-recovery-tests.mjs`, `scripts/m2-08-browser-qa.mjs`, `package.json`, `.github/workflows/m2-08-browser.yml`: permanent targeted and real-browser gates.

---

### Task 1: Recovery persistence contract and domain types

**Files:**
- Create: `database/migrations/0043_assessment_attempt_recovery.up.sql`
- Create: `database/migrations/0043_assessment_attempt_recovery.down.sql`
- Modify: `src/lib/assessment-attempt/assessment-attempt-domain.ts`
- Create: `src/lib/assessment-attempt/assessment-attempt-recovery-domain.ts`
- Create: `tests/platform/assessment-attempt-recovery-contract.test.mjs`
- Create: `tests/platform/assessment-attempt-recovery-rollback.test.mjs`

**Interfaces:**
- Extend `AssessmentAttemptStatus` to exactly `"IN_PROGRESS" | "INTERRUPTED" | "RECOVERABLE" | "SUBMITTED"`.
- Produce `AssessmentDraftValue = string | boolean | null`.
- Produce `AssessmentDraftSnapshot = Readonly<{ attemptId: string; position: number; questionVersionId: string; questionType: QuestionType; value: AssessmentDraftValue; revision: number; updatedAt: string }>`.
- Produce `AssessmentDraftSaveInput = Readonly<{ attemptId: string; position: number; questionVersionId: string; value: AssessmentDraftValue; expectedRevision: number | null; mutationKey: string }>`.
- Produce `AssessmentInterruptionReason = "EMERGENCY_EXIT" | "TECHNICAL_ISSUE_EXIT"`.
- Produce `AssessmentTechnicalIssueCategory = "CONNECTIVITY" | "DISPLAY_OR_INPUT" | "BROWSER_OR_DEVICE" | "ACCESSIBILITY" | "OTHER"` and `AssessmentTechnicalIssueMode = "CONTINUE" | "EXIT"`.
- Produce server-only replacement reason values `"FORM_INTEGRITY_FAILURE" | "FORM_POLICY_INCOMPATIBLE" | "SERVER_RECOVERY_REQUIRED"`.
- Produce ID creators using the existing `createIdentifier` convention for `assessment_interruption`, `assessment_issue`, and `assessment_recovery`.
- `normalizeAssessmentDraftValue(questionType, rawValue, options)` preserves draft edit state and returns only draft-safe typed storage values; it must not call or weaken `normalizeAssessmentAnswer`.

- [ ] **Step 1: Write the RED schema/domain contract tests**

The tests must require all of these missing contracts before any production file is added:

```text
assessment_attempts statuses = IN_PROGRESS | INTERRUPTED | RECOVERABLE | SUBMITTED
SUBMITTED remains terminal at database transition level
assessment_attempt_drafts has one row per attempt and exact attempt/form/item/question/version lineage
assessment_attempt_drafts has revision >= 1, latest mutation key, SHA-256 mutation digest, created/updated timestamps
MULTIPLE_CHOICE draft = valid pinned option or null
TRUE_FALSE draft = boolean or null
SHORT_TEXT draft = exact string including empty/whitespace, <= 2,000 Unicode code points
LONG_TEXT draft = exact string including empty/whitespace, <= 20,000 Unicode code points
INTEGER/DECIMAL draft = exact string, including empty/partial states, <= 128 Unicode code points
assessment_attempt_interruptions contains reason/position/question-version/idempotency only; no answer field
assessment_technical_issue_reports contains bounded category/description/mode and safe position metadata; no automatic answer/draft field
assessment_attempt_recovery_lineage uniquely links predecessor and successor and database-enforces same case/Worker/catalogue/blueprint lineage
generated_assessment_forms gains nullable recovery_source_attempt_id
normal form uniqueness remains one PRIMARY form per case/blueprint
one recovery form maximum per recovery_source_attempt_id
global generated_assessment_form_items UNIQUE(worker_account_id, question_id) remains present
new audit action keys are accepted; rollback restores pre-0043 vocabulary with the repository's NOT VALID historical-evidence pattern
```

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-contract.test.mjs tests/platform/assessment-attempt-recovery-rollback.test.mjs
```

Expected: FAIL because migration `0043` and the recovery domain do not exist and the current status type exposes only `IN_PROGRESS | SUBMITTED`.

- [ ] **Step 2: Implement draft-form normalization without touching committed normalization**

Use this exact semantic split:

```ts
MULTIPLE_CHOICE -> null OR exact delivered option string
TRUE_FALSE      -> null OR boolean
SHORT_TEXT      -> exact string, [...value].length <= 2_000
LONG_TEXT       -> exact string, [...value].length <= 20_000
INTEGER         -> exact string, [...value].length <= 128
DECIMAL         -> exact string, [...value].length <= 128
```

`""`, leading/trailing whitespace, `"-"`, `"."`, and `"1."` are valid draft states where applicable. They are not made commit-valid. Keep the existing M2.07 `normalizeAssessmentAnswer` implementation unchanged.

- [ ] **Step 3: Implement migration `0043` with database-enforced lifecycle and lineage**

The migration must:

```text
1. extend platform audit action vocabulary with:
   assessment.attempt.interrupted
   assessment.technical_issue.reported
   assessment.attempt.recovery.eligible
   assessment.attempt.resumed
   assessment.attempt.replacement.created
   assessment.attempt.recovery.failed
2. replace the assessment_attempts status/check constraints for the four-state lifecycle
3. add a lifecycle trigger that rejects SUBMITTED -> anything, position regression/jumps, and position changes outside IN_PROGRESS
4. add assessment_attempt_drafts with composite lineage FKs equivalent to committed answers
5. add assessment_attempt_interruptions
6. add assessment_technical_issue_reports
7. add an assessment_attempts composite unique key supporting same-case/Worker/catalogue/blueprint predecessor/successor FKs
8. add assessment_attempt_recovery_lineage with UNIQUE(predecessor_attempt_id) and UNIQUE(successor_attempt_id)
9. add a superseded-predecessor progression trigger/guard
10. add generated_assessment_forms.recovery_source_attempt_id referencing assessment_attempts
11. replace UNIQUE(case_id, blueprint_version_id) with a partial PRIMARY-form unique index where recovery_source_attempt_id IS NULL
12. add a unique recovery-source index where recovery_source_attempt_id IS NOT NULL
```

The down migration must drop only M2.08-owned tables/triggers/functions/supporting constraints, restore the original PRIMARY form uniqueness on a clean rollback stack, and fail closed rather than destructively deleting immutable recovery forms if recovery rows already exist. Preserve historical audit rows using the established `NOT VALID` older-vocabulary restoration pattern.

- [ ] **Step 4: Verify GREEN, migration rollback/reapply, and M2.07 append-only regression**

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-contract.test.mjs tests/platform/assessment-attempt-recovery-rollback.test.mjs
node --test tests/platform/assessment-attempt-contract.test.mjs tests/platform/assessment-attempt-rollback.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add database/migrations/0043_assessment_attempt_recovery.* src/lib/assessment-attempt/assessment-attempt-domain.ts src/lib/assessment-attempt/assessment-attempt-recovery-domain.ts tests/platform/assessment-attempt-recovery-contract.test.mjs tests/platform/assessment-attempt-recovery-rollback.test.mjs
git commit -m "feat: add M2.08 recovery persistence contract"
```

---

### Task 2: Server draft repository, CAS autosave, and latest-mutation idempotency

**Files:**
- Create: `src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts`
- Create: `src/lib/assessment-attempt/assessment-attempt-recovery-service.ts`
- Create: `tests/platform/assessment-attempt-draft-runtime.test.mjs`
- Create: `tests/platform/assessment-attempt-recovery-concurrency-runtime.test.mjs`
- Create: `scripts/run-assessment-attempt-recovery-tests.mjs`

**Interfaces:**
- `AssessmentAttemptRecoveryRepository.findDraft(attemptId): Promise<AssessmentDraftSnapshot | null>`.
- `AssessmentAttemptRecoveryRepository.findDraftForUpdate(attemptId): Promise<StoredAssessmentDraft | null>`.
- `AssessmentAttemptRecoveryRepository.insertDraft(...)`, `updateDraftCas(...)`, `deleteMatchingDraft(...)` are transaction-local primitives; no repository method trusts Worker identity from browser input.
- `AssessmentAttemptRecoveryService.saveDraft(principal, input: AssessmentDraftSaveInput, now?: Date): Promise<AssessmentDraftSnapshot>`.
- `AssessmentDraftConflictError` carries only the owning Worker's safe current `AssessmentDraftSnapshot` for explicit reconciliation.

- [ ] **Step 1: Write RED autosave tests for all six types and clear states**

Cover:

```text
live owning Worker first save with expectedRevision=null -> revision 1
MULTIPLE_CHOICE option / null clear round-trip
TRUE_FALSE boolean / null clear round-trip
SHORT_TEXT exact leading/trailing whitespace and empty string round-trip
LONG_TEXT exact leading/trailing whitespace and empty string round-trip
INTEGER partial "-" and empty string round-trip
DECIMAL partial "." and "1." round-trip
autosave inserts zero assessment_attempt_answers rows
autosave never changes current_position
wrong role, revoked session, cross-Worker attempt -> generic access failure
stale position/questionVersionId -> conflict
submitted/interrupted/recoverable/superseded attempt -> cannot accept normal draft save
no draft value appears in audit/timeline rows
```

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --drafts
```

Expected: FAIL because recovery repository/service do not exist.

- [ ] **Step 2: Implement authoritative draft save transaction**

`saveDraft` must use the same live-session checks as M2.07 and execute this order:

```text
validate minimal reference/revision/mutation-key syntax
transaction start
revalidate live active Worker + worker.assessments.read
lock owned attempt
reject non-IN_PROGRESS or superseded attempt
load authoritative current generated-form item
compare browser position/question-version stale guards
normalize only draft-form value against pinned question type/options
load current draft FOR UPDATE
apply latest-mutation idempotency/CAS rules
insert revision 1 or update to revision + 1
return safe snapshot only
```

Compute `mutation_digest_hex` server-side with SHA-256 over a deterministic serialization of `{position, questionVersionId, value}`. Never log the serialized payload.

- [ ] **Step 3: Write RED concurrency/idempotency tests**

Prove:

```text
two writers from revision 1 -> first accepted revision 2, second conflicts with revision 2 snapshot
latest accepted mutation key + same payload -> returns existing revision without increment
latest accepted mutation key + different payload -> conflict
older delayed request with stale expectedRevision -> conflict even if its mutation key existed before
parallel first writes -> one revision 1, loser gets current snapshot
clearing a newer draft to empty/null cannot resurrect an older non-empty value
```

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --concurrency
```

Expected before CAS hardening: FAIL.

- [ ] **Step 4: Harden row locking/CAS until GREEN and keep M2.07 green**

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --drafts
node scripts/run-assessment-attempt-recovery-tests.mjs --concurrency
npm run test:m2-07
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts src/lib/assessment-attempt/assessment-attempt-recovery-service.ts tests/platform/assessment-attempt-draft-runtime.test.mjs tests/platform/assessment-attempt-recovery-concurrency-runtime.test.mjs scripts/run-assessment-attempt-recovery-tests.mjs
git commit -m "feat: persist revisioned assessment drafts"
```

---

### Task 3: Atomic draft cleanup on immutable answer commit

**Files:**
- Modify: `src/lib/assessment-attempt/assessment-attempt-repository.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-service.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts`
- Create: `tests/platform/assessment-attempt-recovery-commit-runtime.test.mjs`
- Modify: `scripts/run-assessment-attempt-recovery-tests.mjs`

**Interfaces:**
- Preserve `AssessmentAttemptService.submitCurrentAnswer(principal, { attemptId, position, questionVersionId, answer }, now)` as the only current-answer commit API.
- Add `AssessmentAttemptRecoveryRepository.deleteMatchingDraft({ attemptId, formId, formItemId, position, questionVersionId }): Promise<boolean>`.
- Add `AssessmentAttemptRecoveryRepository.findSuccessorAttemptId(predecessorAttemptId): Promise<string | null>` so M2.07 commit refuses a superseded predecessor even if stale client state still says `IN_PROGRESS`.

- [ ] **Step 1: Write RED draft/commit separation tests**

Cover:

```text
server draft exists + invalid/incomplete explicit commit -> commit fails, draft remains, position unchanged
server draft exists + valid explicit commit -> committed answer inserted once, matching draft deleted, then position advances
final valid commit -> answer inserted, draft deleted, then status SUBMITTED
forced committed-answer insert failure -> draft and current position remain
forced draft-delete failure -> entire transaction rolls back including committed answer
forced progression failure -> committed answer and draft deletion roll back
stale tab cannot commit after another tab advanced
superseded predecessor cannot commit
existing identical M2.07 replay remains idempotent
```

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --commit
```

Expected: FAIL because M2.07 commit currently leaves server drafts untouched and does not know supersession.

- [ ] **Step 2: Insert draft deletion between immutable answer insert and progression**

Keep this exact transaction ordering:

```text
lock owned attempt
refuse superseded/non-IN_PROGRESS
resolve authoritative current item
validate stale guards
normalize committed answer using existing M2.07 normalizeAssessmentAnswer
insert immutable assessment_attempt_answers row
if matching server draft exists -> delete it by exact attempt/form/item/position/question-version lineage
advance position OR mark SUBMITTED
commit transaction
```

Do not make draft existence a precondition for commit; a Worker may commit while server autosave is unavailable if the explicit current input is valid.

- [ ] **Step 3: Keep committed-answer normalization strict**

Explicitly prove these drafts remain uncommittable until valid:

```text
INTEGER "-"
DECIMAL "."
DECIMAL "1."
empty SHORT_TEXT after final trim
empty LONG_TEXT after final trim
MULTIPLE_CHOICE null
TRUE_FALSE null
```

The M2.07 committed values remain trimmed text / safe integer / finite number exactly as before.

- [ ] **Step 4: Verify GREEN and append-only regression**

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --commit
npm run test:m2-07
node --test tests/platform/assessment-attempt-answer-runtime.test.mjs tests/platform/assessment-attempt-concurrency-runtime.test.mjs
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-attempt/assessment-attempt-repository.ts src/lib/assessment-attempt/assessment-attempt-service.ts src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts tests/platform/assessment-attempt-recovery-commit-runtime.test.mjs scripts/run-assessment-attempt-recovery-tests.mjs
git commit -m "feat: clear drafts atomically on assessment commit"
```

---

### Task 4: Interruption, recovery eligibility, and same-form resume lifecycle

**Files:**
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-service.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-service.ts`
- Create: `tests/platform/assessment-attempt-interruption-runtime.test.mjs`
- Modify: `scripts/run-assessment-attempt-recovery-tests.mjs`

**Interfaces:**
- `interrupt(principal, { attemptId, position, questionVersionId, reason, mutationKey }, now?): Promise<AssessmentRecoveryLifecycleSnapshot>`.
- `establishRecoveryEligibility(principal, { attemptId }, now?): Promise<AssessmentRecoveryLifecycleSnapshot>`.
- `resumeSameForm(principal, { attemptId }, now?): Promise<AssessmentAttemptView>`.
- `AssessmentRecoveryLifecycleSnapshot` returns only attempt ID, lifecycle status, current position, and safe recovery mode; it contains no question content/answer/draft unless the operation is the authorized resume result.

- [ ] **Step 1: Write RED lifecycle tests**

Cover:

```text
IN_PROGRESS explicit Emergency Exit -> INTERRUPTED + durable interruption row
same interruption mutation key retry -> one row / one transition
INTERRUPTED normal commit/draft save -> blocked
INTERRUPTED -> RECOVERABLE only through server recovery eligibility operation
RECOVERABLE -> IN_PROGRESS only through explicit same-form resume
same-form resume preserves same attempt/form/current_position/current question/version/committed answers/server draft
normal reload of IN_PROGRESS does not create interruption row or lifecycle transition
SUBMITTED cannot interrupt/recover/resume
wrong Worker/non-Worker/revoked session cannot transition
concurrent interrupt vs commit has one serialized winner; impossible mixed state is rejected
```

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --lifecycle
```

Expected: FAIL because lifecycle transitions do not exist.

- [ ] **Step 2: Implement conditional lifecycle repository methods**

Use SQL updates with exact expected source status and row locks. `establishRecoveryEligibility` must validate owned attempt/form/current-item integrity and absence of a successor before setting `RECOVERABLE`. `resumeSameForm` must revalidate the same conditions and return to `IN_PROGRESS` without moving position or modifying committed answers/draft.

- [ ] **Step 3: Add safe timeline/audit evidence without draft content**

Use case status `Assessment in progress` as both assurance timeline from/to status; attempt lifecycle is carried by event type/metadata. Add:

```text
assessment_attempt_interrupted + audit assessment.attempt.interrupted
assessment_attempt_recovery_eligible + audit assessment.attempt.recovery.eligible
assessment_attempt_resumed + audit assessment.attempt.resumed
```

Metadata may include attempt ID, position, lifecycle status, reason, timestamps, revision number when useful. It must not include the draft value.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --lifecycle
npm run test:m2-07
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-attempt tests/platform/assessment-attempt-interruption-runtime.test.mjs scripts/run-assessment-attempt-recovery-tests.mjs
git commit -m "feat: add assessment interruption recovery lifecycle"
```

---

### Task 5: Bounded technical-issue reporting with continue/exit semantics

**Files:**
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-service.ts`
- Create: `tests/platform/assessment-attempt-technical-issue-runtime.test.mjs`
- Modify: `scripts/run-assessment-attempt-recovery-tests.mjs`

**Interfaces:**
- `reportTechnicalIssue(principal, { attemptId, position, questionVersionId, category, description, mode, mutationKey }, now?): Promise<AssessmentTechnicalIssueResult>`.
- Description is trimmed, non-empty, and at most 2,000 Unicode code points.
- Browser does not supply Worker ID, form lineage, audit metadata, or answer/draft attachments.

- [ ] **Step 1: Write RED report tests**

Cover:

```text
all five categories accepted; unknown category rejected
empty or >2,000-code-point description rejected
report-and-continue inserts one report and leaves lifecycle IN_PROGRESS
report-and-exit inserts report + interruption atomically and leaves lifecycle INTERRUPTED
same mutation key + same report is idempotent
same mutation key + different report fails closed
wrong owner/non-Worker/revoked session blocked
stored report contains only authored description + safe operational metadata
report table has no automatic answer/draft/key/rubric/scoring columns
platform audit/timeline contains category/mode/status only and never description
```

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --issues
```

Expected: FAIL because report persistence/service behavior is missing.

- [ ] **Step 2: Implement report persistence and transactional exit mode**

`CONTINUE` must insert/return the report without lifecycle change. `EXIT` must perform report insertion and the same conditional interruption transition used by Emergency Exit in one transaction. A service-level retry of the same mutation must converge without duplicate report/interruption rows.

- [ ] **Step 3: Add safe evidence**

Append audit action `assessment.technical_issue.reported`. Timeline event type `assessment_technical_issue_reported` may record category/mode and case/attempt status only. Never copy the Worker-authored description into audit/timeline/log metadata.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --issues
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-attempt tests/platform/assessment-attempt-technical-issue-runtime.test.mjs scripts/run-assessment-attempt-recovery-tests.mjs
git commit -m "feat: add safe assessment issue reporting"
```

---

### Task 6: Exceptional successor form/attempt recovery without question reuse

**Files:**
- Modify: `src/lib/assessment-generation/assessment-form-generation-service.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-repository.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-repository.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-recovery-service.ts`
- Create: `tests/platform/assessment-attempt-replacement-runtime.test.mjs`
- Modify: `scripts/run-assessment-attempt-recovery-tests.mjs`

**Interfaces:**
- Add `AssessmentFormGenerationService.generateRecoveryForAttempt(principal, { caseId, blueprintVersionId, predecessorAttemptId }, now): Promise<GeneratedAssessmentForm>`; this is server-only and is never exposed directly to a browser action.
- Add `AssessmentAttemptRecoveryService.createReplacementRecovery(principal, { attemptId, reason }, now?): Promise<AssessmentAttemptView>`; `reason` is an internal server-only `AssessmentReplacementReason`, not a browser field.
- Add repository reads for predecessor/successor lineage and successor-safe attempt creation in initial `RECOVERABLE` state.

- [ ] **Step 1: Write RED replacement tests before changing form-generation constraints/service**

Cover:

```text
replacement can run only for owned INTERRUPTED/RECOVERABLE predecessor through server-only service
normal generateForCase still returns exactly one primary form per case/blueprint
recovery generation creates a distinct immutable form keyed to predecessor attempt
candidate exclusion still queries all previously generated Worker question IDs
current displayed/uncommitted predecessor question is excluded because it is already in immutable generated-form history
global UNIQUE(worker_account_id, question_id) remains enforced
successor uses same Worker/case/catalogue/blueprint and starts at position 1 as RECOVERABLE
lineage predecessor/successor is unique
case assessment_reference moves from predecessor to successor in same transaction
predecessor draft is deleted in successful activation and never copied to successor
predecessor cannot save/commit/resume after lineage exists
insufficient unseen question capacity -> controlled recovery failure, no successor/form/reference movement
parallel replacement requests -> one successor only
```

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --replacement
```

Expected: FAIL because the existing generator only permits a single case/blueprint form and has no recovery-source identity.

- [ ] **Step 2: Refactor generation into explicit PRIMARY and RECOVERY entry points without weakening M2.05**

Keep `generateForCase` behavior unchanged and make its lookup explicitly filter `recovery_source_attempt_id IS NULL`. Add a recovery lookup by `recovery_source_attempt_id`. Both paths reuse the same selector allocation and this existing strongest exclusion query in meaning:

```sql
SELECT DISTINCT i.question_id
FROM generated_assessment_forms f
JOIN generated_assessment_form_items i ON i.form_id=f.form_id
WHERE f.worker_account_id=$1
```

Never subtract predecessor questions from that exclusion set. Recovery generation permits case status `Assessment in progress` only after validating the predecessor is the same case/Worker/blueprint and the case active assessment reference still points to that predecessor.

- [ ] **Step 3: Implement atomic replacement activation**

Inside one transaction:

```text
revalidate live Worker
lock predecessor + Assurance Case
require predecessor INTERRUPTED or RECOVERABLE and not already superseded
require case.assessment_reference = predecessor attempt
create/load one recovery form for predecessor with unseen questions only
insert successor attempt as RECOVERABLE on that form
insert unique recovery lineage with shared case/Worker/catalogue/blueprint fields
update assurance_cases.assessment_reference to successor and recovery next_action
remove predecessor server draft
append safe timeline/audit linkage
return successor safe view
```

Audit `assessment.attempt.replacement.created` may include predecessor/successor/form IDs and reason code but no draft/answer content. Capacity/integrity failure may audit `assessment.attempt.recovery.failed` with a bounded reason code only.

- [ ] **Step 4: Verify GREEN plus original M2.05/M2.07 generation regressions**

Run:

```bash
node scripts/run-assessment-attempt-recovery-tests.mjs --replacement
npm run test:m2-07
node --test tests/platform/assessment-form-generation-contract.test.mjs tests/platform/assessment-form-generation-runtime.test.mjs
npm run typecheck
npm run lint
```

If the exact M2.05 runner names differ on the implementation base, use the repository's existing M2.05 targeted runner rather than inventing a new one; the test files above are current-base discovery targets and must be verified before execution.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-generation/assessment-form-generation-service.ts src/lib/assessment-attempt tests/platform/assessment-attempt-replacement-runtime.test.mjs scripts/run-assessment-attempt-recovery-tests.mjs
git commit -m "feat: add non-repeating assessment recovery successors"
```

---

### Task 7: Recovery-safe client projection and server-action boundaries

**Files:**
- Modify: `src/lib/assessment-attempt/assessment-attempt-client-view.ts`
- Modify: `src/lib/assessment-attempt/assessment-attempt-domain.ts`
- Create: `src/lib/assessment-attempt/assessment-recovery-owner.ts`
- Modify: `src/app/worker/(portal)/assessments/[attemptId]/actions.ts`
- Modify: `src/app/worker/(portal)/assessments/[attemptId]/page.tsx`
- Create: `tests/platform/assessment-attempt-recovery-action-boundary.test.mjs`
- Create: `tests/platform/assessment-attempt-recovery-projection.test.mjs`

**Interfaces:**
- Extend `AssessmentAttemptClientView` to safe fields only: `{ status, currentQuestion, serverDraft, submitted, replacementAttemptId }`.
- `serverDraft` uses `AssessmentDraftSnapshot`; no form/form-item/Worker identity or hidden assessment metadata is projected.
- Produce server-only `assessmentRecoveryOwnerHandle(accountId: string): string`, an HMAC/pepper-derived opaque stable handle used only to namespace same-browser recovery material.
- Add server actions:

```ts
saveAssessmentDraftAction(input: AssessmentDraftSaveInput): Promise<AssessmentDraftActionResult>
interruptAssessmentAction(input: AssessmentInterruptClientInput): Promise<AssessmentLifecycleActionResult>
reportAssessmentIssueAction(input: AssessmentIssueClientInput): Promise<AssessmentIssueActionResult>
establishAssessmentRecoveryAction(input: { attemptId: string }): Promise<AssessmentLifecycleActionResult>
resumeAssessmentAction(input: { attemptId: string }): Promise<AssessmentLifecycleActionResult>
```

- Keep `submitAssessmentAnswerAction(previousState, formData)` as the committed-answer form action.

- [ ] **Step 1: Write RED projection/action source and runtime tests**

Assert:

```text
page GET calls only owned read/projection and never interrupt/recover/replace
all mutation actions derive principal through requirePlatformPermission(expectedRole=worker, permission=worker.assessments.read)
actions accept only minimum stale guards/revision/mutation payloads
no action accepts workerAccountId/formId/formItemId/replacementReason from browser
conflict action result may contain own current server draft only
HTML/client projection contains no answerKey/rubric/score/correct/futureQuestions/form array
INTERRUPTED/RECOVERABLE/superseded view does not render an active answer form before authorized resume
replacementAttemptId is returned only for the same owning Worker predecessor
```

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-action-boundary.test.mjs tests/platform/assessment-attempt-recovery-projection.test.mjs
```

Expected: FAIL because M2.08 projection/actions do not exist.

- [ ] **Step 2: Implement safe lifecycle/draft projection**

For `IN_PROGRESS`, return one current question plus owning server draft. For `INTERRUPTED` or `RECOVERABLE`, return lifecycle state and no active answer form until resume. For `SUBMITTED`, return submitted receipt state. For a superseded predecessor, return the safe successor attempt reference and no active question.

- [ ] **Step 3: Implement action adapters with coarse public errors**

Map invalid shape to safe input errors, wrong owner/session to generic unavailable behavior, and stale revision/position to controlled conflicts. Never serialize exception stacks, DB errors, hidden lineage, or draft payload into logs.

- [ ] **Step 4: Verify GREEN and existing action-boundary regressions**

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-action-boundary.test.mjs tests/platform/assessment-attempt-recovery-projection.test.mjs tests/platform/assessment-attempt-action-boundary.test.mjs tests/platform/assessment-attempt-ui-contract.test.mjs
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-attempt src/app/worker/'(portal)'/assessments/'[attemptId]'/actions.ts src/app/worker/'(portal)'/assessments/'[attemptId]'/page.tsx tests/platform/assessment-attempt-recovery-action-boundary.test.mjs tests/platform/assessment-attempt-recovery-projection.test.mjs
git commit -m "feat: expose safe assessment recovery actions"
```

---

### Task 8: Encrypted same-device recovery store

**Files:**
- Create: `src/lib/assessment-attempt/assessment-recovery-local-store.ts`
- Create: `tests/platform/assessment-attempt-local-recovery-contract.test.mjs`
- Create: `tests/platform/assessment-attempt-local-recovery-browser.test.mjs`

**Interfaces:**
- `LocalAssessmentDraft = Readonly<{ ownerHandle: string; attemptId: string; position: number; questionVersionId: string; questionType: QuestionType; value: AssessmentDraftValue; baseRevision: number | null; localSequence: number; updatedAt: string }>`.
- `PendingAssessmentRecoveryOperation` is a discriminated union of `INTERRUPTION` and `TECHNICAL_ISSUE`; it never contains automatically captured answer text.
- Browser module exports:

```ts
saveEncryptedLocalDraft(input: LocalAssessmentDraft): Promise<boolean>
loadEncryptedLocalDraft(scope: { ownerHandle: string; attemptId: string; position: number; questionVersionId: string }): Promise<LocalAssessmentDraft | null>
deleteEncryptedLocalDraft(scope): Promise<void>
enqueueEncryptedRecoveryOperation(ownerHandle, operation): Promise<boolean>
loadEncryptedRecoveryOperations(ownerHandle): Promise<readonly PendingAssessmentRecoveryOperation[]>
deleteEncryptedRecoveryOperation(ownerHandle, mutationKey): Promise<void>
clearAssessmentRecoveryOwner(ownerHandle: string): Promise<void>
```

- IndexedDB database name is versioned, for example `hseverify-assessment-recovery-v1`; object stores separate non-exportable `CryptoKey` records from encrypted payload records.

- [ ] **Step 1: Write RED source contract plus Playwright browser-storage tests**

Require:

```text
AES-GCM 256-bit key generated with extractable=false
CryptoKey persisted through IndexedDB structured clone, never exported/raw/base64 encoded
unique random 96-bit IV for every encryption
ciphertext record contains version/iv/ciphertext and safe indexing metadata only
plaintext draft/description does not appear in localStorage/sessionStorage or IndexedDB ciphertext record fields
same owner can decrypt after page reload
wrong owner handle cannot load/render another owner's record through public API
old position/question scope does not return into a new current question
clearAssessmentRecoveryOwner deletes that owner's key/draft/pending-operation records
storage/crypto failure returns false/error state; caller cannot claim local protection
```

Run source contract first:

```bash
node --test tests/platform/assessment-attempt-local-recovery-contract.test.mjs
```

Expected: FAIL because the browser recovery store does not exist.

- [ ] **Step 2: Implement minimal native Web Crypto + IndexedDB store**

Use `crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])`. Persist the non-exportable `CryptoKey` directly in IndexedDB. Store only ciphertext plus IV and minimal record metadata. Use the server-provided opaque `ownerHandle` as namespace; never derive recovery ownership from a browser-entered account identifier.

- [ ] **Step 3: Exercise real browser storage semantics**

Run the dedicated browser test through Playwright/Chromium using the same pinned Playwright version as existing browser gates. Verify reload persistence and account-switch isolation with real IndexedDB/CryptoKey structured cloning rather than a Node mock.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
node --test tests/platform/assessment-attempt-local-recovery-contract.test.mjs
npm run typecheck
npm run lint
```

The browser runtime test is added to the M2.08 browser workflow in Task 11; locally run it when Chromium is available.

- [ ] **Step 5: Commit**

```bash
git add src/lib/assessment-attempt/assessment-recovery-local-store.ts tests/platform/assessment-attempt-local-recovery-contract.test.mjs tests/platform/assessment-attempt-local-recovery-browser.test.mjs
git commit -m "feat: encrypt local assessment recovery state"
```

---

### Task 9: Local-first autosave, reconnect flush, and explicit stale conflict UI

**Files:**
- Create: `src/components/worker/use-assessment-draft-recovery.ts`
- Create: `src/components/worker/assessment-recovery-controls.tsx`
- Modify: `src/components/worker/assessment-workspace.tsx`
- Create: `tests/platform/assessment-attempt-recovery-ui-contract.test.mjs`
- Create: `tests/platform/assessment-attempt-recovery-client-browser.test.mjs`

**Interfaces:**
- `AssessmentSaveStatus = "idle" | "saving" | "saved" | "offline-local" | "local-unavailable" | "conflict"`.
- `useAssessmentDraftRecovery({ ownerHandle, view })` exposes current editable string, `setDraftValue`, save status, server/local conflict values, `flushNow`, `useSavedVersion`, `keepDeviceVersion`, and pending-operation retry state.
- Local mutation keys use `crypto.randomUUID()` and each accepted local edit increments a local sequence.

- [ ] **Step 1: Write RED UI/browser tests**

Cover:

```text
server draft hydrates exact current control on authenticated reload
local unsynced draft from same owner/question is considered only after server view matches owner/attempt/position/question-version
edit -> encrypted local write occurs before debounced server call
server accepted current revision -> status Saved
network/server failure + encrypted local write success -> Offline — saved on this device
local storage failure -> never display Offline — saved on this device as protected
visibilitychange/blur requests immediate flush without committing answer
reconnect flush uses latest expected server revision
server/local both changed from same base -> explicit conflict; no automatic overwrite
Use saved version replaces local edit with server value and rewrites local buffer
Keep this device version sends a new mutation against latest server revision
stale local record for prior position is ignored/cleaned
successful Next/Submit cleanup removes obsolete local record
```

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-ui-contract.test.mjs
```

Expected: FAIL because the hook/UI recovery state is missing.

- [ ] **Step 2: Change numeric answer controls to preserve exact edit strings**

The current M2.07 INTEGER/DECIMAL controls use `type="number"`, which may normalize/drop partial values. Replace only those two controls with controlled `type="text"` inputs using `inputMode="numeric"` / `inputMode="decimal"` and accessible numeric hints. Keep the answer as a string until `encodeAnswer` performs final commit parsing. Do not make partial `-`, `.`, or `1.` submit-valid.

- [ ] **Step 3: Implement local-first then debounced-server synchronization**

Use this ordering for every edit:

```text
update React draft string
persist encrypted local draft immediately
set Saving…
start/reset short debounce timer for server save
on server accepted current revision -> update base revision + local envelope -> Saved
on network/session transport failure -> keep local envelope and show truthful local/offline status only if encryption succeeded
```

Do not debounce the local encryption write behind the server call. `Next`/`Submit assessment` remains a separate form action and visually separate from save-state text.

- [ ] **Step 4: Implement explicit conflict arbitration and verify GREEN**

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-ui-contract.test.mjs
npm run typecheck
npm run lint
```

Expected: PASS. The real two-tab/offline browser cases are executed by Task 11.

- [ ] **Step 5: Commit**

```bash
git add src/components/worker/assessment-workspace.tsx src/components/worker/use-assessment-draft-recovery.ts src/components/worker/assessment-recovery-controls.tsx tests/platform/assessment-attempt-recovery-ui-contract.test.mjs tests/platform/assessment-attempt-recovery-client-browser.test.mjs
git commit -m "feat: autosave and reconcile active assessment drafts"
```

---

### Task 10: Emergency Exit, technical-issue UX, offline retry, and explicit logout cleanup

**Files:**
- Modify: `src/components/worker/use-assessment-draft-recovery.ts`
- Modify: `src/components/worker/assessment-recovery-controls.tsx`
- Modify: `src/components/worker/assessment-workspace.tsx`
- Create: `src/components/auth/assessment-recovery-sign-out.tsx`
- Modify: `src/components/auth/role-portal-shell.tsx`
- Create: `tests/platform/assessment-attempt-recovery-exit-ui-contract.test.mjs`
- Create: `tests/platform/assessment-attempt-recovery-auth-cleanup.test.mjs`

**Interfaces:**
- `emergencyExit(): Promise<void>` always ends with navigation to `/worker/dashboard` in a `finally` path.
- `reportTechnicalIssue({ category, description, mode }): Promise<void>` supports `CONTINUE` and `EXIT`; exit mode shares the local-protect/flush/leave behavior.
- `retryPendingRecoveryOperations()` retries encrypted queued interruption/report operations only after the current authorized server view confirms the same owner/attempt/current question.
- `AssessmentRecoverySignOut` clears `ownerHandle` recovery material before invoking existing `signOutCurrentPortal`; non-Worker roles continue using the existing shared sign-out behavior unchanged.

- [ ] **Step 1: Write RED exit/report/logout UI contracts**

Require:

```text
Emergency Exit control exists on active IN_PROGRESS assessment
Emergency Exit never invokes submitAssessmentAnswerAction
Emergency Exit ordering = local encrypt -> immediate server draft flush attempt -> interruption attempt -> dashboard navigation in finally
failed/offline server calls cannot trap Worker in assessment
Report Technical Issue exposes exactly five categories and <=2,000-code-point authored description
copy warns Worker not to paste assessment answers into issue description
Report and continue leaves active page/lifecycle
Report and exit follows same safe leave path
failed offline interruption/report is encrypted into pending-operation queue with idempotency key and no automatically captured answer text
reconnect/reauth retry deletes queue item only after idempotent server acceptance
explicit Worker logout clears local draft/key/pending-report material
unexpected session loss does not automatically clear encrypted material but UI cannot decrypt/render it before same-owner server revalidation
different Worker login in same browser never renders prior Worker's draft
company/assessor/verifier/admin/root sign-out behavior is unchanged
```

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-exit-ui-contract.test.mjs tests/platform/assessment-attempt-recovery-auth-cleanup.test.mjs
```

Expected: FAIL because these controls/cleanup hooks do not exist.

- [ ] **Step 2: Implement Emergency Exit with unconditional safe navigation**

Do not wait indefinitely for server writes. Attempt local save synchronously/awaitably, then bounded best-effort draft flush/interruption. Whether those calls succeed, conflict, reject, or time out, navigate to `/worker/dashboard`. Never synthesize a committed answer.

- [ ] **Step 3: Implement report continue/exit and encrypted offline queue**

Queue only the Worker-authored issue payload and safe stale guards/idempotency metadata; the current draft remains a separate encrypted draft record. On authorized reconnect, retry using original mutation keys so server idempotency collapses duplicates.

- [ ] **Step 4: Hook explicit Worker sign-out cleanup at the existing portal boundary**

`RolePortalShell` currently calls `signOutCurrentPortal`, which centrally revokes the auth session. Keep that server action unchanged. For `session.role === "worker"`, render `AssessmentRecoverySignOut` with the server-derived opaque owner handle; its client-side coordinated action clears recovery material and then calls `signOutCurrentPortal`. Other roles continue rendering the current confirmation control.

- [ ] **Step 5: Verify GREEN and auth isolation regressions**

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-exit-ui-contract.test.mjs tests/platform/assessment-attempt-recovery-auth-cleanup.test.mjs tests/platform/authentication-portal-isolation.test.mjs tests/platform/authentication-signed-out-proxy.test.mjs
npm run typecheck
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/worker src/components/auth/assessment-recovery-sign-out.tsx src/components/auth/role-portal-shell.tsx tests/platform/assessment-attempt-recovery-exit-ui-contract.test.mjs tests/platform/assessment-attempt-recovery-auth-cleanup.test.mjs
git commit -m "feat: make assessment interruption controls resilient"
```

---

### Task 11: Permanent M2.08 targeted runner and real Chromium recovery gate

**Files:**
- Create: `scripts/check-assessment-attempt-recovery.mjs`
- Modify: `scripts/run-assessment-attempt-recovery-tests.mjs`
- Create: `scripts/m2-08-browser-qa.mjs`
- Modify: `package.json`
- Create: `.github/workflows/m2-08-browser.yml`
- Create: `tests/platform/assessment-attempt-recovery-browser-contract.test.mjs`
- Modify: `tests/platform/assessment-attempt-permanent-gate-contract.test.mjs`

**Interfaces:**
- Add package scripts `check:m2-08` and `test:m2-08`.
- `scripts/m2-08-browser-qa.mjs` owns deterministic PGlite seed plus real Chromium journey and may accept `--seed-only`, matching the existing M2.07 harness style.
- `.github/workflows/m2-08-browser.yml` runs on `feat/m2-08-answer-recovery`, relevant PR paths to `main`, and manual dispatch; use the repository's pinned Playwright `1.55.0` unless the verified implementation base has already intentionally upgraded it.

- [ ] **Step 1: Write RED permanent-gate contract**

Require the workflow/script/package hooks and require the M2.07 permanent gate to stay referenced. The M2.08 workflow path filters must include:

```text
scripts/m2-08-browser-qa.mjs
src/app/worker/(portal)/assessments/**
src/components/worker/**
src/components/auth/assessment-recovery-sign-out.tsx
src/lib/assessment-attempt/**
src/lib/assessment-generation/**
database/migrations/0043_assessment_attempt_recovery.*
.github/workflows/m2-08-browser.yml
```

Run:

```bash
node --test tests/platform/assessment-attempt-recovery-browser-contract.test.mjs tests/platform/assessment-attempt-permanent-gate-contract.test.mjs
```

Expected: FAIL because the M2.08 workflow/harness does not exist.

- [ ] **Step 2: Build the deterministic browser seed and scenarios**

The real Chromium gate must cover at minimum:

```text
all six draft types
clear/unselected recovery
exact short/long whitespace recovery
partial INTEGER "-" and DECIMAL "1." recovery without commit
server draft reload recovery
same-device unsynced encrypted local recovery after simulated server/network failure
cross-device/browser-context server-draft recovery without original local key
truthful Saving/Saved/offline copy
two-tab stale revision conflict and both explicit resolution choices
latest mutation retry idempotency
Next commit deletes draft and reveals exactly one next question
Emergency Exit online
Emergency Exit with failed server calls still leaves page
INTERRUPTED -> RECOVERABLE -> IN_PROGRESS same-form resume
Report and continue
Report and exit
queued offline report retry
revoked session blocks save/resume/report
explicit logout cleanup and different-Worker same-profile isolation
server-controlled replacement successor/no-repeat path
insufficient replacement question capacity fails closed
submitted/superseded predecessor cannot reopen
no answer key/rubric/score/future-question/form-array leaks in HTML or action payloads
```

Keep server logs as artifacts on failure/success, but the harness itself must not print draft/answer values into logs.

- [ ] **Step 3: Wire targeted scripts without removing M2.07 gates**

`test:m2-08` must execute every RED-derived M2.08 platform test. `check:m2-08` must perform static/permanent-contract checks. Do not fold M2.08 into `test:m2-07`; both milestones remain independently callable.

- [ ] **Step 4: Verify GREEN locally/CI-compatible**

Run:

```bash
npm run check:m2-08
npm run test:m2-08
npm run test:m2-07
node --test tests/platform/assessment-attempt-permanent-gate-contract.test.mjs
npm run typecheck
npm run lint
```

Then run `node scripts/m2-08-browser-qa.mjs --seed-only` against a clean PGlite database and the full browser journey where Chromium is available.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-assessment-attempt-recovery.mjs scripts/run-assessment-attempt-recovery-tests.mjs scripts/m2-08-browser-qa.mjs package.json .github/workflows/m2-08-browser.yml tests/platform/assessment-attempt-recovery-browser-contract.test.mjs tests/platform/assessment-attempt-permanent-gate-contract.test.mjs
git commit -m "test: permanently gate M2.08 recovery behavior"
```

---

### Task 12: Exact-head regression, review, PR, merge, and post-merge verification

**Files:**
- Modify only if evidence requires a real defect fix; otherwise no production changes.
- Update: `.engineering/CONTINUATION.json` and milestone acceptance/evidence documents using the repository's established governance pattern after gates are green.

**Interfaces:**
- The accepted implementation head is immutable evidence: every final targeted/browser/full-system result must name the exact same PR head SHA.
- Merge must use expected-head protection so a moved PR head cannot be merged under stale evidence.

- [ ] **Step 1: Run the complete targeted regression set on the exact implementation head**

Run:

```bash
npm run check:m2-08
npm run test:m2-08
npm run test:m2-07
node --test tests/platform/assessment-attempt-browser-contract.test.mjs tests/platform/assessment-attempt-permanent-gate-contract.test.mjs
npm run typecheck
npm run lint
npm run build
```

Expected: PASS.

- [ ] **Step 2: Run migration rollback/reapply on the exact head**

Use a clean PGlite test database and the repository migration scripts:

```bash
npm run db:migrate
npm run db:status
npm run db:rollback
npm run db:migrate
npm run db:status
```

Confirm 0043 rolls back/reapplies on the clean stack and all M2.07 tables/append-only protections return intact.

- [ ] **Step 3: Push/open the implementation PR and require exact-head browser gates**

Require GREEN on the same PR head for:

```text
M2.08 targeted tests/checks
M2.08 real Chromium QA
existing M2.07 real browser QA
full Engineering Gate (`npm run verify:full` through repository workflow)
permanent Independent full-system audit
```

If any gate fails, inspect the exact failure, add a RED regression reproducer, fix root cause, rerun the affected slice, and then rerun every final exact-head gate. Do not merge a head whose evidence belongs to an earlier SHA.

- [ ] **Step 4: Review security/secrecy and diff scope before merge**

Explicitly inspect the final diff for:

```text
no autosave writes to assessment_attempt_answers
no removal/weakening of Worker/question global uniqueness
no answer/draft/free-text issue content in audit/timeline/log metadata
no hidden scoring/question-bank fields in browser projections
no client-selected replacement reason/form/Worker identity
no role-isolation weakening
no Previous/backtracking path
no M2.09/M2.10 scope creep
```

Resolve all review threads and rerun any gate invalidated by a code change.

- [ ] **Step 5: Record acceptance, merge with expected-head protection, and re-verify exact main**

After all exact PR-head gates are GREEN, record M2.08 acceptance evidence in `.engineering` using the repository's established format, merge only with expected-head SHA protection, then verify the resulting `main` SHA. Require post-merge Engineering Gate and permanent Independent full-system audit GREEN on that exact main SHA before marking M2.08 `ACCEPTED_MERGED_POST_MERGE_VERIFIED`.

- [ ] **Step 6: Commit governance-only acceptance evidence if the repository pattern requires a separate closure PR**

Use a docs/governance-only closure commit/PR; do not mix unrelated cleanup or future-milestone code into M2.08 acceptance.
