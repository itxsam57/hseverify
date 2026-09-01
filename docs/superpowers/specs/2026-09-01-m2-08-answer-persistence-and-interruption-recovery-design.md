# M2.08 Answer Persistence and Interruption Recovery Design

## Status

Architecture approved in the M2.08 design review on 2026-09-01. This document is the corrected formal design proposed for owner spec approval and is based on verified `main` commit `768169e94831dbf29cb0335f11148ffb9dc79b92`.

**No implementation is authorized by this document yet.** The repository's separate owner spec-approval gate must pass before an implementation plan is generated or any production migration, test, service, action, component, package script, or workflow is changed for M2.08.

A self-review of the first draft found scope drift and corrected it here. M2.08 does **not** add a persistent browser answer cache, new assessment lifecycle states, successor/replacement forms, or a technical-issue reporting subsystem. Those additions were not part of the approved architecture and would unnecessarily widen the milestone.

## Goal

Make the active Worker assessment resilient to ordinary interruption without weakening any accepted M2.07 guarantee.

A Worker must be able to type the current uncommitted answer, have that in-progress work autosaved to a server-authoritative draft, reload or return later, and recover the latest draft that the server actually acknowledged. The Worker must also have a clear **Save and exit** path and a separate **Emergency exit** path that never traps them.

Autosave is never answer submission. `Next` and final `Submit assessment` remain the only operations that create an immutable committed answer and advance the attempt.

## Existing M2.07 contracts that remain locked

M2.08 extends the accepted M2.07 attempt lifecycle; it does not redesign it.

The following remain mandatory:

- `assessment_attempt_answers` is the append-only committed-answer ledger.
- Attempt statuses remain exactly `IN_PROGRESS | SUBMITTED` in M2.08.
- A Worker receives exactly one current pinned question at a time.
- Future questions, complete form item arrays, answer keys, rubrics, correctness, scoring, pass/fail, and reviewer-only data never enter Worker responses or browser state.
- Worker identity comes only from the live trusted authorization principal.
- The authoritative current form item comes from the locked attempt/form lineage, never browser-supplied form or question authority.
- A committed answer is inserted before progression.
- A committed answer cannot be edited, deleted, or replaced.
- There is no Previous/back-editing control.
- Final submission leaves the Assurance Case at `Assessment in progress`; M2.10 owns later scoring/review state.
- M2.05 generated-form immutability/non-repeat behavior and M2.06 ownership/eligibility behavior remain unchanged.
- Existing M2.07 targeted, Chromium, regression, Engineering, and independent-audit gates remain required.

## Scope boundary

M2.08 owns only:

1. one mutable server draft for the active uncommitted question;
2. server-authoritative draft autosave;
3. raw edit-state preservation for all six existing question types;
4. optimistic draft revisions and stale-tab/device conflict protection;
5. recovery of the latest server-acknowledged current draft after reload, browser restart, session interruption, or another device login;
6. truthful saving/saved/error UI state;
7. explicit **Save and exit** behavior;
8. explicit **Emergency exit** behavior that never traps the Worker;
9. a Worker-visible **In progress / Resume assessment** entry point for owned `IN_PROGRESS` attempts;
10. atomic removal of the matching draft when its answer becomes immutably committed;
11. migration, rollback, security, browser, and regression evidence for those behaviors.

M2.08 explicitly does **not** own:

- persistent localStorage, IndexedDB, service-worker, or other browser answer caching;
- offline claims that unsent keystrokes are durable;
- new `INTERRUPTED`, `RECOVERABLE`, `ABANDONED`, or successor attempt statuses;
- replacement/successor assessment forms or retake/reassessment orchestration;
- technical-issue ticket/report workflows;
- webcam, microphone, screen capture, focus/window enforcement, proctoring, integrity incidents, or anti-cheat scoring;
- answer correctness, scoring, pass/fail, rubric review, reviewer allocation, result publication, or `Review pending` transition;
- Previous navigation or committed-answer editing.

M2.09 and M2.10 remain separate Governor bricks.

## Architectural decision

M2.08 uses **server-authoritative durable draft persistence beside the immutable M2.07 committed-answer path**.

Three meanings remain distinct:

- **React edit state** — what is currently visible while the page is open; temporary and not described as durable.
- **Server draft** — the latest uncommitted current-question value that the server accepted; mutable, revisioned, recoverable.
- **Committed answer** — immutable M2.07 evidence created only by `Next` or final `Submit assessment`.

The browser does not keep a persistent answer cache. This avoids leaving candidate answer material behind on shared devices and avoids creating a second recovery authority. Cross-device recovery therefore has one simple truth: the latest server-acknowledged draft.

If connectivity fails before a change reaches the server, the UI must say that the newest change is not yet saved. M2.08 guarantees recovery of acknowledged server drafts, not impossible recovery of keystrokes that never reached durable storage.

## Server draft aggregate

Introduce a dedicated mutable table, conceptually `assessment_attempt_drafts`.

There is at most one draft per attempt because M2.07 permits editing only the authoritative current question.

The draft persists:

- `attemptId`;
- `formId`;
- `formItemId`;
- `position`;
- `questionId`;
- `questionVersionId`;
- `questionType`;
- one draft-form value;
- monotonically increasing `revision`;
- latest accepted mutation/idempotency key and a safe payload digest for retry comparison;
- `createdAt`;
- `updatedAt`.

The database must bind the row to the same attempt/form/item/question/version lineage used by M2.07 committed answers. Application transactions additionally require that the draft position is still the locked attempt's current position.

A draft row must never be accepted for a submitted attempt, a foreign Worker, a non-current form item, or a position that already has a committed answer.

### Draft values are not committed-answer values

Autosave preserves edit state, including states that are intentionally not yet submit-valid. It must not call final committed-answer normalization as a prerequisite for saving.

Draft representation is deliberately narrow:

- `MULTIPLE_CHOICE`: pinned option string or no selection (`null`); any selected value must be one of the delivered pinned options.
- `TRUE_FALSE`: boolean or no selection (`null`).
- `SHORT_TEXT`: exact editable string, including empty string and leading/trailing whitespace, maximum 2,000 Unicode code points.
- `LONG_TEXT`: exact editable string, including empty string and leading/trailing whitespace, maximum 20,000 Unicode code points.
- `INTEGER`: exact bounded input string, maximum 128 Unicode code points, so partial states such as `-`, `+`, or digits in progress survive autosave.
- `DECIMAL`: exact bounded input string, maximum 128 Unicode code points, so partial states such as `-`, `.`, `1.`, or exponent/decimal editing states survive autosave.

Final validation and normalization remain exclusively on the M2.07 commit path. An incomplete draft can be saved and recovered but still rejected by `Next`/`Submit assessment` until it is a valid final answer.

Clearing a previously saved value must itself be persistable. Recovery must not resurrect an older non-empty value merely because the current draft is empty or unselected.

## Draft-save command

The assessment-attempt service gains a server draft-save boundary. The client supplies only stale/concurrency guards and the draft value; it never supplies Worker authority or trusted form lineage.

A save request contains at most:

- `attemptId`;
- echoed current `position`;
- echoed current `questionVersionId`;
- draft-form value;
- `expectedRevision` or first-write sentinel;
- client-generated mutation/idempotency key.

Inside one transaction the server must:

1. verify the live active Worker principal and `worker.assessments.read` permission;
2. lock the owned attempt;
3. require `IN_PROGRESS`;
4. resolve the authoritative current generated-form item;
5. require the echoed position/question version to match that item;
6. prove no committed answer already owns that current position;
7. validate only draft-form shape/bounds for the pinned question type/options;
8. load the current draft revision;
9. apply compare-and-swap against `expectedRevision`;
10. treat an exact retry of the latest accepted mutation key and payload as idempotent;
11. reject reuse of that mutation key with a different payload;
12. insert/update the draft and increase revision only when all preconditions hold;
13. return only the safe current draft value, revision, and saved timestamp.

A delayed request from an older revision is stale even if it arrives last. It never overwrites newer server state.

## Concurrency and stale-tab/device arbitration

Draft `revision` is monotonically increasing.

Required behavior:

- two tabs that start from the same revision cannot silently overwrite each other;
- the first valid compare-and-swap may win, while the other receives a controlled conflict;
- delayed requests from an old revision cannot overwrite a newer value;
- exact retry of the latest accepted mutation converges idempotently;
- same mutation key with different content fails closed;
- a tab on an old question cannot save after another request commits and advances the attempt;
- a submitted attempt can never accept another draft.

For a true same-question conflict, the UI fetches the authoritative current server draft and presents a deliberate choice such as **Use saved version** or **Replace saved version with this tab**. Replacing must be a new compare-and-swap against the latest revision; there is no blind force-write.

If the authoritative attempt has already advanced, local edit state from the old question is discarded from the active UI and cannot be written into the new position.

## Recovery projection

`getOwnedView()` remains a read-only authenticated operation. For an `IN_PROGRESS` attempt it may return the existing single current-question projection plus that question's current server draft.

The client projection may expose only:

- current question fields already accepted in M2.07;
- current draft value or `null`;
- current draft revision or first-write state;
- server `updatedAt` needed for truthful save feedback.

It must not expose internal attempt records, form arrays, later questions, answer keys, rubrics, scores, correctness, pass/fail, reviewer data, mutation digests, or server-only lineage.

On page load the answer control initializes from the current server draft. If there is no draft it initializes empty/unselected exactly as M2.07 does today.

Cross-device recovery therefore works automatically after normal authentication because the server draft, not device storage, is authoritative.

## Autosave UI behavior

The assessment workspace continues to render one question only.

While the page is open:

- answer controls update React state immediately;
- changes are debounced before server save to avoid per-keystroke writes;
- blur/visibility changes may request an earlier flush when practical;
- only one normal autosave is in flight at a time from a tab;
- a newer local change is never marked saved merely because an older request completed.

Persistence copy must be truthful:

- `Saving…` while the current edit differs from the last acknowledged server revision or a save is in flight;
- `Saved` only when the server has accepted the exact current edit state;
- `Not saved — reconnecting` (or equivalent) when the server cannot be reached;
- controlled conflict copy when the server rejects a stale revision.

The UI must never claim an offline/unsent edit is durable.

## Save and exit

The active assessment has a clear **Save and exit** control separate from `Next`/`Submit assessment`.

Save and exit must:

1. attempt to flush the exact current edit state through the normal authorized draft-save command;
2. wait for the server to acknowledge that exact value;
3. on success, leave the attempt `IN_PROGRESS` and navigate to the Worker assessment/portal surface;
4. never commit the answer;
5. never advance position;
6. never create scoring/review/integrity state.

If the flush fails, Save and exit does **not** falsely report success. The Worker remains on the page with clear options to retry or use Emergency exit.

## Emergency exit

The active assessment also exposes an **Emergency exit** control so connectivity or a server problem cannot trap the Worker.

Emergency exit:

- may make a best-effort immediate server draft save when possible;
- does not wait indefinitely for that save;
- never commits the answer;
- never advances the attempt;
- leaves the attempt status `IN_PROGRESS`;
- navigates safely out of the assessment even if the save cannot reach the server;
- tells the Worker that only the last server-confirmed `Saved` version is guaranteed to recover.

M2.08 does not create a new interruption lifecycle record merely to represent leaving the page. Future integrity/proctoring work may add separate evidence when its own milestone is designed.

## Resume assessment entry point

The current Available Assessments page lists only eligible `Assessment pending` cases. Once M2.07 starts an attempt, that case becomes `Assessment in progress` and therefore disappears from the pending list.

M2.08 adds a separate **In progress** section sourced from owned `assessment_attempts` where:

- `worker_account_id` equals the live Worker;
- `status = 'IN_PROGRESS'`;
- the related Assurance Case remains consistent with that attempt;
- no client-supplied Worker identifier participates in the query.

Each item exposes **Resume assessment** and only safe descriptive metadata. Resume is a read-only navigation to the existing owned attempt page; GET does not mutate the attempt, draft, or case.

A reload of the attempt URL and Resume assessment produce the same authoritative current question and latest server draft.

## Immutable commit path and draft cleanup

`submitCurrentAnswer()` remains the only committed-answer authority.

M2.08 extends its existing transaction narrowly:

1. validate the live Worker and lock the owned attempt;
2. resolve the authoritative current item;
3. reject stale position/question-version input;
4. normalize and validate the explicit answer using the unchanged M2.07 committed-answer rules;
5. insert the immutable committed answer exactly once;
6. delete the matching current-question server draft in the same transaction;
7. only then advance position or mark the attempt submitted;
8. return only the next single-question projection or submitted receipt.

The explicit submitted answer remains authoritative for commit; the autosave draft is recovery state, not a hidden alternate submission channel.

If committed-answer validation fails, the draft remains. If answer insertion, draft deletion, or progression fails, the whole transaction rolls back. There is no state in which progression succeeds while the answer or cleanup did not.

A stale autosave that arrives after successful commit/advance fails the locked current-position/question-version check and cannot recreate a draft for the old question.

Final successful submission leaves no draft for the attempt.

## Session, logout, and account switching

Draft reads/saves always require a live Worker session and ownership. Expired/revoked sessions cannot read or mutate a draft.

Because M2.08 deliberately creates no persistent browser answer cache:

- explicit logout requires no client answer-store cleanup;
- a later account in the same browser cannot inherit a previous Worker's answer from local persistence;
- reauthentication for the same Worker recovers only the server-owned draft that authorization permits;
- another Worker receives the existing indistinguishable access/not-found behavior for the attempt.

## Privacy, logging, and retention

Draft content is assessment answer material and is handled as sensitive application data.

It must not be copied into:

- generic audit metadata;
- Assurance timeline metadata;
- application logs;
- error messages;
- analytics/telemetry;
- notification/email content.

Routine autosave revisions do not create per-keystroke audit events.

Only one current server draft exists per attempt. The matching draft is deleted when its answer commits, and final submission therefore leaves no current draft. M2.08 does not add a historical draft archive.

## Database migration boundary

A new M2.08 migration pair creates/drops only M2.08-owned draft persistence and any minimal supporting constraints/indexes required for exact lineage and compare-and-swap.

M2.08 does **not** change the accepted attempt status vocabulary and does not require new assessment lifecycle audit action keys.

The migration must enforce or support:

- one draft per attempt;
- exact attempt/form/item/question/version lineage;
- revision >= 1;
- bounded draft values by question type;
- a foreign-key path that cannot bind a draft to an item outside its attempt form;
- efficient owned current-draft lookup;
- clean down/reapply behavior without deleting committed answers or attempts.

Rollback drops M2.08 draft structures only. Historical M2.07 attempts/answers and audit evidence remain untouched.

## Authorization and secrecy

Every read/mutation derives Worker ownership from the trusted authorization principal and rechecks live role/account/session state server-side.

A browser may echo attempt, position, question-version, revision, mutation key, and draft value only. It cannot choose:

- Worker identity;
- form/form-item authority;
- arbitrary question authority;
- attempt status;
- scoring/reviewer authority.

Cross-Worker, non-Worker, revoked-session, submitted-attempt, stale-position, stale-question-version, and stale-revision operations fail closed with coarse errors that do not disclose hidden resource existence or assessment secrets.

## Error behavior

Public-facing behavior remains coarse and recovery-safe:

- invalid references/draft shape: input error;
- foreign resource/wrong role/revoked session: generic access/not-found behavior;
- stale draft revision: controlled conflict that requires authoritative reload/reconciliation;
- stale position/question version: reload current assessment state;
- invalid final answer: existing M2.07 answer error; draft remains;
- server/network save failure: UI keeps the edit in current in-memory state while the page remains open and truthfully reports it as unsaved;
- corrupted lineage/invariants: fail closed and do not advance or overwrite.

No error contains future questions, correct answers, rubrics, draft content, scoring data, or foreign-resource detail.

## Testing contract

Implementation must follow strict RED -> GREEN -> REFACTOR. No production M2.08 behavior is written before the corresponding automated test has failed for the expected missing-behavior reason.

Permanent coverage must include at least:

### Persistence/domain

- migration creates exact-lineage draft storage and rolls down/reapplies cleanly;
- one draft per attempt;
- revision constraints;
- committed answer schema/append-only trigger remains unchanged;
- attempt status vocabulary remains `IN_PROGRESS | SUBMITTED`.

### Draft values

- all six question types autosave/recover valid edit state;
- MCQ rejects non-pinned options but permits cleared selection;
- TRUE_FALSE permits cleared selection;
- text preserves exact leading/trailing/internal whitespace and empty state within limits;
- INTEGER preserves partial strings such as `-`;
- DECIMAL preserves partial strings such as `.`, `1.`, and `-`;
- final commit still rejects incomplete/invalid draft-form input when submitted as an answer.

### Authorization/concurrency

- owning active Worker can read/save current draft;
- other Worker, non-Worker, revoked/expired session fail closed;
- two saves from the same revision cannot silently overwrite each other;
- exact latest mutation retry is idempotent;
- same mutation key with changed content conflicts;
- delayed old revision is stale;
- stale old-position save after progression cannot recreate a draft;
- submitted attempt cannot accept a draft.

### Commit continuity

- successful commit deletes the matching draft atomically before progression completes;
- answer validation failure preserves draft/current position;
- forced committed-answer persistence failure preserves draft/current position;
- forced draft-deletion failure rolls back answer/progression;
- duplicate/concurrent M2.07 commit behavior remains idempotent and append-only;
- final submission leaves no draft.

### Resume/exit UI

- Available Assessments GET remains read-only;
- owned `IN_PROGRESS` attempts appear separately as resumable;
- foreign attempts never appear;
- Resume assessment is read-only navigation;
- Save and exit waits for an exact server acknowledgement and never commits/progresses;
- failed Save and exit stays truthful and offers retry/Emergency exit;
- Emergency exit never traps the Worker and never claims an unsaved edit is durable;
- saving status corresponds to the exact latest edit, not an older completed request.

### Real Chromium proof

A deterministic real-server browser journey must prove at minimum:

1. Worker login and start of an eligible assessment;
2. type into a current answer without committing it;
3. autosave reaches `Saved`;
4. reload and recover the exact server draft on the same question;
5. Save and exit returns to the Worker assessment surface;
6. the attempt appears under In progress and Resume assessment restores the same current question/draft;
7. another tab/device-equivalent stale revision cannot overwrite newer server state;
8. `Next` commits the explicit valid answer, removes the draft, and reveals only the next question;
9. delayed old-position autosave is rejected;
10. final submission leaves no draft;
11. cross-Worker direct draft/attempt probes fail closed;
12. captured HTML/network bodies still contain no future question, answer key, rubric, scoring/pass-fail, reviewer data, or server-only draft lineage.

The browser harness must fail on relevant page errors/console errors and retain screenshots/evidence using the repository's repaired audit conventions.

## Permanent regression gates

M2.08 acceptance requires fresh exact-head evidence for:

- dedicated M2.08 static/source contract;
- dedicated M2.08 runtime tests;
- dedicated M2.08 real Chromium journey;
- strict TypeScript;
- lint;
- M2.07 targeted tests;
- M2.07 dedicated browser QA;
- inherited Hard Browser/retrospective coverage required by the repository;
- Full Engineering Gate;
- permanent Independent full-system audit;
- independent code/architecture, security/data-integrity, UI/dead-control, stale/temporary-code, and regression review.

Tests may be strengthened but never weakened merely to make M2.08 green.

## Acceptance criteria

M2.08 is accepted only when all of the following are proven on one exact candidate head:

1. The Worker can persist and recover one uncommitted current-question server draft without committing it.
2. Draft storage is separate from `assessment_attempt_answers` and does not weaken append-only committed answers.
3. All six question types preserve their required edit states, including empty text and partial numeric strings.
4. Worker identity/form lineage remains server authoritative.
5. Cross-Worker/non-Worker/revoked-session draft access fails closed.
6. Revision compare-and-swap prevents silent stale-tab overwrite.
7. Exact latest retry is idempotent; conflicting mutation-key reuse fails.
8. Reload/browser restart/cross-device authentication recovers the latest server-acknowledged draft only.
9. The UI never describes unsent in-memory input as saved.
10. Save and exit persists the exact current edit before leaving and does not commit or progress.
11. Emergency exit never traps the Worker and truthfully limits recovery to the latest acknowledged server draft.
12. Owned `IN_PROGRESS` attempts appear as resumable without re-running eligibility or creating a second attempt.
13. Resume GET is read-only and returns only the authoritative current question/draft.
14. Successful answer commit deletes the matching draft atomically and only then progresses.
15. Any failure in commit/draft cleanup/progression rolls back coherently.
16. A delayed autosave after progression cannot recreate an old-position draft.
17. Submitted attempts have no draft and reject new draft saves.
18. Draft content does not enter logs, audit/timeline metadata, analytics, notifications, or browser-persistent caches.
19. No future question/form array, answer key, rubric, scoring/pass-fail, or reviewer-only data crosses the Worker boundary.
20. M2.07 accepted behavior remains green, including one-question projection, immutable answers, idempotency, cross-Worker denial, and final Assurance Case status.
21. No M2.09 integrity/proctoring behavior is introduced.
22. No M2.10 scoring/review/result behavior is introduced.
23. No replacement/successor form or unrelated technical-support subsystem is introduced.
24. Dedicated M2.08 Chromium and all permanent repository regression/Engineering/audit gates are green on the exact acceptance head.
25. Independent Gatekeeper review finds no blocking defect or scope creep.

## Rollback and recovery strategy

The M2.08 draft migration is additive around M2.07. Its down migration removes only M2.08-owned mutable draft persistence/supporting indexes or constraints.

Rollback must not delete or rewrite:

- `assessment_attempts`;
- `assessment_attempt_answers`;
- M2.05 generated forms/items;
- Assurance Case history;
- platform audit history.

If M2.08 runtime behavior is rolled back after deployment, committed M2.07 progression remains valid. Uncommitted M2.08 draft rows may be removed by the explicit down migration because they are recovery convenience state, not committed assessment evidence.

## Definition of done

M2.08 is `ACCEPTED` only when the owner has approved this formal spec, an implementation plan generated **after that approval** has been executed through strict RED -> GREEN slices on an isolated feature branch, all acceptance criteria have fresh exact-head evidence, independent Gatekeeper review accepts the result, and merge/post-merge verification are separately complete.

Until the owner approves this written spec, the correct Governor state is `OWNER_REQUIRED / M2.08_WAITING_FOR_SPEC_APPROVAL` and no M2.08 implementation may begin.
