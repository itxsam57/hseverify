# M2.08 Answer Persistence and Interruption Recovery Design

## Status

Approved architecture captured from the M2.08 design review on 2026-09-01. This document is the proposed implementation contract for M2.08 and is based on verified `main` commit `768169e94831dbf29cb0335f11148ffb9dc79b92`.

This specification still requires the repository's separate owner spec-approval gate before an implementation plan, production migration, tests, or runtime code may be written.

## Goal

Make an active Worker assessment resilient to reloads, crashes, connectivity loss, session interruption, technical problems, and emergency exits without weakening any accepted M2.07 guarantee.

A Worker must be able to type an uncommitted answer, have that exact in-progress work protected automatically, leave or lose the assessment window safely, and recover the correct current question and latest recoverable draft. Autosave must never be mistaken for answer submission. `Next` and final `Submit assessment` remain the only operations that commit an answer and progress the immutable attempt.

The recovery design is server-authoritative, with an encrypted device-local safety buffer for work that has not yet reached the server.

## Existing contracts this design extends

M2.08 extends, rather than replaces, the accepted M2.07 attempt lifecycle:

- `src/lib/assessment-attempt/assessment-attempt-service.ts` owns Worker authorization, locks the attempt inside mutations, resolves the authoritative current generated-form item, inserts an immutable committed answer, and advances position only after that insert succeeds.
- `assessment_attempt_answers` remains the immutable committed-answer ledger. M2.08 never turns it into an autosave table and never adds answer editing/backtracking.
- The Worker receives one current-question projection only. Future questions, complete form contents, answer keys, rubrics, correctness, scores, pass/fail state, and reviewer-only data remain absent from Worker responses and browser state.
- Existing generated forms and pinned question versions remain immutable.
- Existing Worker/question non-repeat guarantees from form generation are preserved. Recovery may strengthen exclusion but must never weaken it.
- The accepted M2.07 browser and permanent regression gates remain required throughout M2.08.

## Scope boundary

M2.08 owns:

1. mutable persistence for the one active, uncommitted answer;
2. autosave from the assessment UI to server-authoritative draft state;
3. an encrypted same-device local buffer for unsynced active work;
4. deterministic reconnect, reload, crash, stale-tab, and cross-device recovery;
5. explicit interruption and recovery state transitions;
6. a functional Emergency Exit path that cannot trap the Worker;
7. functional technical-issue reporting with continue/exit choices;
8. same-form recovery by default;
9. controlled successor-attempt/form recovery when same-form continuation is impossible or unsafe;
10. lineage sufficient to preserve interrupted history and identify a recovery successor;
11. audit/timeline evidence for recovery events without automatic inclusion of answer content;
12. cleanup of draft/local recovery state after commit, final submission, explicit logout, or replacement.

M2.08 does **not** own:

- webcam, microphone, screen, focus, secure-window, or other proctoring/integrity capture;
- anti-cheat rules, integrity incidents, or integrity scoring;
- assessment correctness, scoring, pass/fail, rubric review, reviewer allocation, or result publication;
- written-answer reviewer workflow;
- retake/reassessment policy unrelated to interruption recovery;
- arbitrary answer editing or Previous/back navigation.

Those responsibilities remain in M2.09/M2.10 or later roadmap work.

## Architectural decision

M2.08 uses a layered server-authoritative recovery architecture.

Two rejected designs are explicit:

1. **Autosave into `assessment_attempt_answers`.** Rejected because a mutable autosave would destroy the meaning of the append-only committed-answer ledger and could make typing equivalent to submission.
2. **Client-only recovery.** Rejected because browser-local state cannot be authoritative across devices, cannot safely arbitrate stale tabs, cannot prove ownership after session changes, and can be lost with browser/device storage.

The accepted design separates three meanings:

- **local draft buffer**: encrypted best-effort protection for this browser/device;
- **server draft**: authoritative latest accepted uncommitted input for the current position;
- **committed answer**: immutable M2.07 evidence created only by Next/final Submit.

No layer is allowed to blur those meanings.

## Server draft aggregate

Introduce a dedicated mutable persistence boundary, conceptually `assessment_attempt_drafts`.

There is at most one server draft for an attempt because only the current question can be answered. The row is bound to the exact current form item and contains enough lineage to make cross-position or cross-form corruption impossible.

The draft persists at least:

- `attemptId`;
- `formId`;
- `formItemId`;
- `position`;
- `questionId`;
- `questionVersionId`;
- `questionType`;
- a bounded draft-form value appropriate to that question type;
- monotonically increasing `revision`;
- the latest accepted mutation/idempotency key;
- `createdAt`;
- `updatedAt`.

The six question types remain the accepted M2.07 types:

- `MULTIPLE_CHOICE`;
- `TRUE_FALSE`;
- `SHORT_TEXT`;
- `LONG_TEXT`;
- `INTEGER`;
- `DECIMAL`.

### Draft-form values are deliberately not committed-answer values

Autosave must preserve what the Worker is currently editing, including states that are not yet submit-valid. Therefore M2.08 must not run final committed-answer normalization as a precondition for every draft write.

The draft representation is narrow and type-specific:

- `MULTIPLE_CHOICE`: selected option string or no selection; any non-null selection must match the pinned delivered options;
- `TRUE_FALSE`: boolean or no selection;
- `SHORT_TEXT`: exact editable string, including an empty string and meaningful leading/trailing whitespace while the Worker is still editing, bounded by the existing final-answer size limit plus only implementation-safe transport/storage overhead if required;
- `LONG_TEXT`: exact editable string with the same principle and the existing final-answer size boundary;
- `INTEGER`: bounded input string so partial states such as `-`, `+`, or digits in progress can survive recovery;
- `DECIMAL`: bounded input string so partial states such as `-`, `.`, `1.`, or exponent/decimal editing states can survive recovery.

Final answer normalization/validation remains exclusively on the commit path. `Next`/`Submit assessment` may reject an incomplete draft exactly as M2.07 rejects an invalid submitted answer, without deleting that draft.

A Worker clearing a previously saved answer to an empty/unselected draft must be able to persist that cleared state. Recovery must never resurrect an older non-empty server value merely because the new draft is not yet submit-valid.

The database must enforce lineage equivalent to or stronger than committed answers: the draft's attempt/form/form-item/question/version must all refer to the authoritative current generated-form item for that attempt. Application transactions additionally enforce current-position semantics and live Worker ownership.

Draft content must not appear in generic audit metadata, timeline metadata, logs, technical-issue metadata, exception messages, analytics, or telemetry.

## Autosave command

The server exposes a draft-save operation through the assessment-attempt service boundary. Browser-supplied Worker identity, form lineage, or arbitrary question IDs are never trusted as authority.

A draft save accepts only the minimum stale-request guards and draft-form payload needed for the owning Worker, including:

- attempt reference;
- echoed current position/question-version reference;
- type-specific draft input;
- `expectedRevision` (or first-write sentinel);
- a client-generated mutation/idempotency key.

Inside one transaction the command must:

1. verify the live active Worker principal and permission;
2. lock the owned attempt;
3. require that the attempt is currently allowed to accept drafts;
4. resolve the authoritative current generated-form item from the locked attempt;
5. reject stale/mismatched position or question-version guards;
6. validate only the safe **draft-form** shape/bounds for the pinned question type;
7. compare the supplied expected revision with the current server draft revision;
8. make a retry of the latest accepted mutation key idempotent;
9. reject a reused latest mutation key carrying a different payload;
10. insert/update the draft and increment revision only when concurrency preconditions hold;
11. return only safe current-draft metadata/value to the owning Worker.

Older delayed requests whose expected revision is no longer current fail as stale even if their old mutation key once succeeded. That is safe and intentional: they never overwrite newer state.

A stale client never wins merely because its network request arrives last.

## Immutable commit path

`Next` and final `Submit assessment` continue to call the committed-answer mutation. M2.08 may extend that transaction to consume the current draft, but it must preserve the M2.07 ordering invariant.

The commit transaction must:

1. validate the live Worker and lock the owned attempt;
2. resolve the authoritative current item;
3. reject stale position/question-version input;
4. normalize and fully validate the explicit current input or exact authoritative draft selected for commit using existing M2.07 committed-answer rules;
5. insert the immutable committed answer exactly once;
6. delete the matching server draft in the same transaction;
7. only after the committed insert succeeds, advance the position or mark the attempt submitted;
8. return only the single next-question projection or submitted receipt.

If the draft is empty, incomplete, or otherwise not commit-valid, commit fails with the existing safe input behavior and preserves the draft/current position.

If the committed insert fails, the draft is not deleted and the position is not advanced. If draft deletion or progression fails, the whole commit transaction rolls back.

A successful commit also instructs the browser to remove the corresponding local encrypted draft. Failure to perform browser cleanup must not change server truth; a stale local buffer must later be recognized as obsolete by authoritative attempt position/revision.

There is still no Previous control and no mutation of a committed answer.

## Encrypted device-local safety buffer

The browser protects current unsynced work immediately before waiting for the debounced server save.

The local buffer uses Web Crypto AES-GCM with a non-exportable device-local `CryptoKey` persisted by the browser's structured-clone-capable storage. Ciphertext and key material are never sent to the server as the recovery authority.

The local payload is deliberately narrow:

- opaque attempt/current-question identity sufficient for safe reconciliation;
- the exact current draft-form value;
- the last server revision observed by this browser;
- a local mutation sequence/timestamp needed to distinguish unsynced changes;
- optional pending technical-issue/interruption metadata that contains no automatically captured answer text.

It must not contain:

- answer keys;
- rubrics;
- correctness/scoring/pass-fail data;
- future question content or full generated form contents;
- credentials or session tokens.

Cross-device recovery never transfers this key or ciphertext. A different device recovers from the server draft only.

If encrypted local storage is unavailable, the UI must not falsely claim device-local protection. Server autosave continues and the status communicates the reduced protection truthfully.

## Save-state UI

The active assessment window displays a small truthful persistence state near the answer area:

- `Saving…` while local changes are awaiting/performing server synchronization;
- `Saved` only after the server has accepted the current draft revision;
- `Offline — saved on this device` only when encrypted local persistence succeeded but server synchronization has not.

The UI must never show `Saved` merely because React state or an unencrypted browser value exists.

Autosave is debounced to avoid per-keystroke server writes, but the local encrypted buffer is updated promptly enough to protect current input. Blur, page visibility changes, Emergency Exit, and explicit technical-issue exit should request an immediate server flush when possible.

## Concurrency and stale-tab/device arbitration

Server draft `revision` is monotonically increasing. Every normal autosave uses compare-and-swap semantics.

Required behavior:

- two tabs starting from the same revision cannot silently overwrite each other;
- a delayed network request from an older revision fails as stale;
- retry of the latest accepted mutation key converges idempotently;
- a different payload reusing the latest accepted mutation key fails closed;
- older delayed/retried mutations are stale and harmless rather than replayed over newer data;
- a stale tab cannot commit a different question after another tab has advanced the attempt;
- unsynced local text/input is not silently discarded when a newer server draft exists.

When a true same-question conflict exists, the Worker receives a controlled recovery choice rather than automatic last-write-wins. The UI may show the server-saved value and this-device value and require an explicit choice such as `Use saved version` or `Keep this device version`. Choosing the local version performs a new mutation against the **latest** server revision; it is not a blind force-write.

No conflict UI exposes another Worker's data because every server read remains principal-owned.

## Recovery precedence

Recovery is deterministic:

1. server attempt ownership, lifecycle, form, current position, and current question are authoritative;
2. server draft is authoritative across devices;
3. same-device local ciphertext is only considered after the server confirms that the authenticated Worker owns the matching attempt/current question;
4. a local record for an old position/form is never injected into the current question;
5. if the server revision has not changed since the local buffer's base revision, unsynced local edits may be safely offered/synchronized;
6. if both server and local state changed from the same base, controlled conflict resolution is required;
7. after successful commit/submission/replacement, obsolete local records are deleted or ignored and then cleaned.

The page must not decrypt and display a previous Worker's local answer merely because the same browser profile is now logged into a different account.

## Attempt interruption/recovery lifecycle

M2.08 expands the attempt lifecycle to support:

`IN_PROGRESS -> INTERRUPTED -> RECOVERABLE -> IN_PROGRESS`

`SUBMITTED` remains terminal.

Meanings:

- `IN_PROGRESS`: normal current-question work, draft save, and commit are allowed;
- `INTERRUPTED`: the server has a durable interruption record and normal progression is paused;
- `RECOVERABLE`: server-side recovery checks have confirmed that the attempt may resume, either on the same form or through a controlled successor path;
- `SUBMITTED`: all answers were committed and the attempt is terminal.

The server, never a browser query parameter, decides whether an interrupted attempt is recoverable.

A browser crash, reload, or transient network loss does not invent a durable `INTERRUPTED` transition when the server received no reliable event. If the attempt is still `IN_PROGRESS`, normal load/reconnect recovery restores the authoritative current question/draft. A later explicit recovery request may convert an observed interruption into the formal lifecycle when server-side checks require it.

Explicit Emergency Exit and report-and-exit paths attempt to mark `INTERRUPTED` immediately. If the server is unreachable, the UI still exits safely and retains an encrypted pending interruption/report marker for retry after connectivity/reauthentication. The Worker must never be trapped in the assessment merely because the interruption write cannot reach the server.

A recovery entry operation evaluates ownership, session state, attempt/form integrity, current position, and form resumability. It can then move `INTERRUPTED -> RECOVERABLE`. An explicit resume operation moves `RECOVERABLE -> IN_PROGRESS` and returns only the current-question projection plus the owning Worker's recoverable draft.

Every transition is conditional/transactional so duplicate requests remain idempotent and concurrent progression cannot race recovery.

## Emergency Exit

Emergency Exit is a first-class functional control available while the Worker is in an active assessment.

On activation the client must:

1. persist the latest local draft using the encrypted local buffer;
2. request an immediate server draft flush if connectivity/session permits;
3. request interruption recording with an idempotency key;
4. navigate safely out of the assessment to the Worker portal/dashboard regardless of whether network writes succeed.

The control must never require answer submission and must never convert the active draft into a committed answer.

On the next authorized visit the server decides the recovery path. The Worker does not obtain a bypass into another role/dashboard and cannot resume a revoked/foreign attempt.

## Report Technical Issue

The assessment window includes a functional technical-issue report action.

A report contains only bounded operational information:

- server-defined category (for example connectivity, display/input, browser/device, accessibility, or other);
- a bounded Worker-authored description;
- attempt reference and safe position metadata added server-side;
- timestamps/idempotency metadata.

The system must never automatically attach the current answer/draft, answer keys, rubrics, screenshots/video/audio, scoring data, hidden form data, or raw page diagnostics to the report. The description field is a deliberately separate bounded user-authored support note; the UI must tell the Worker not to paste assessment answers into it. Audit/timeline copies must contain only category/status metadata, not the free-text description. M2.09 may later own richer integrity/evidence capture; M2.08 does not.

The Worker can choose:

- **Report and continue**: create/queue the report without changing the attempt lifecycle;
- **Report and exit**: protect the draft, create/queue the report, interrupt if possible, and leave through the same safe recovery path as Emergency Exit.

Offline report submission is queued locally with an idempotency key and retried after authorized reconnect. Failure to contact the server must not make the exit control inert.

## Same-form recovery

Same-form recovery is the default and preferred path.

When the immutable generated form is still safe and valid to resume, recovery preserves:

- the same attempt;
- the same immutable form;
- all existing committed answers;
- the same `currentPosition`;
- the same currently pinned question version;
- the latest authoritative server draft, reconciled with same-device unsynced work if applicable.

Recovery does not regenerate already answered questions, does not reset position, does not expose Previous navigation, and does not re-open a committed answer.

## Controlled replacement recovery

Replacement is exceptional and server-controlled. It is used only when the server determines that the original immutable form cannot safely or validly continue.

Replacement must not mutate the interrupted attempt/form into a different history. Instead it creates a linked successor/recovery attempt and immutable successor form.

The lineage must record at least:

- interrupted/source attempt;
- successor attempt;
- recovery reason code;
- creation timestamp;
- trusted server relationship to the same Worker/Assurance Case/assessment policy lineage.

The interrupted predecessor remains historical evidence and cannot later resume or progress once a successor is established. The service/repository must enforce that prohibition from the recovery link even if the predecessor lifecycle value itself remains a recoverable historical state. The Assurance Case's active assessment reference moves atomically to the authorized successor.

Successor generation must preserve the strongest existing non-repeat contract. At minimum it excludes every question ever exposed/displayed to that Worker, including the currently displayed but uncommitted question. If the existing generation ledger already excludes a broader set such as every previously generated/pinned Worker question, that stronger exclusion remains in force.

If there are insufficient eligible never-repeat questions to create a valid successor form, recovery fails closed with a controlled support state. It must never satisfy recovery by silently reusing a prohibited question.

A predecessor server draft that cannot map to the successor question is deleted as part of successful replacement activation; its content is not copied to an unrelated question or audit record. Same-device obsolete local ciphertext is likewise treated as obsolete after the server establishes the successor.

This milestone creates only the minimum lineage foundation required for recovery. M2.10 remains responsible for how scoring/review later interprets a recovery lineage.

## Session expiry, revocation, logout, and account switching

Draft recovery never bypasses authentication.

- An expired/revoked session cannot save, read, commit, resume, or replace an attempt until a valid owning Worker session is re-established.
- Cross-device recovery after reauthentication comes from server state.
- Explicit logout clears assessment local draft/pending-report material from that browser profile.
- If a session disappears unexpectedly, encrypted local material may remain as a safety buffer but is not decrypted/displayed until the server revalidates the same owning Worker/attempt/current question.
- Logging in as a different Worker cannot unlock or render the prior Worker's local answer.
- Role switching cannot provide assessment access to company/reviewer/assessor/admin principals.

## Authorization and secrecy

Every read/mutation derives Worker ownership from the trusted authorization principal and rechecks live session/role/account state server-side.

The browser may echo attempt/position/question-version identifiers as stale guards only. It cannot choose another Worker, arbitrary form item, draft revision authority, lifecycle state, successor form, or replacement reason.

No M2.08 response, HTML, browser state, local recovery object, automatically generated support metadata, audit record, or error message may add any of the M2.07 forbidden data:

- future question prompts/IDs/form arrays;
- answer keys;
- written rubrics/points;
- correctness;
- scoring/pass-fail;
- reviewer-only metadata.

## Error behavior

Public errors remain deliberately coarse and recovery-safe:

- invalid references/value shapes: input error;
- wrong owner/role, expired or revoked session, hidden resource: generic access/not-found behavior;
- stale position/question version, stale revision, concurrent progression, duplicate replacement: conflict behavior;
- corrupted lineage or impossible state transition: fail closed;
- storage/network failure: do not claim server save; retain encrypted local work if available;
- replacement capacity failure: controlled unrecoverable/support state without weakening non-repeat guarantees.

A conflict response may return the owning Worker's safe current draft value when needed for explicit reconciliation, but never another Worker's draft or hidden assessment metadata.

## Database integrity

The M2.08 migration(s) must preserve rollback/reapply support and enforce constraints rather than depending only on UI discipline.

Expected persistence additions include:

- draft storage with one current draft per attempt and exact attempt/form/item/question/version lineage;
- revision/latest-idempotency data for draft compare-and-swap;
- interruption/recovery lifecycle support;
- bounded technical-issue records without automatically captured answer content;
- recovery predecessor/successor lineage when replacement is used.

Constraints/transactions must ensure:

- submitted attempts cannot become recoverable or in-progress again;
- normal draft/commit writes cannot target a submitted, foreign, or superseded attempt;
- only the authoritative current position can own a draft;
- draft-form values obey type-specific safe storage bounds even when not yet submit-valid;
- one successor is established for a given predecessor recovery decision;
- predecessor and successor belong to the same Worker/Assurance Case and compatible assessment policy lineage;
- case active-assessment reference changes atomically with successor activation;
- draft deletion and answer commit/progression are atomic;
- replacement activation cannot leave two concurrently progressable assessment attempts for the same recovery lineage.

## Audit and timeline evidence

Recovery events are auditable with trusted actor binding and stable resource references. Evidence includes only safe metadata such as attempt IDs, lifecycle transitions, revision numbers, reason/category codes, timestamps, and successor linkage.

Audit/timeline events must never include candidate draft/answer content, technical-issue free text, or local ciphertext/key material.

At minimum, evidence should cover:

- explicit interruption recorded;
- technical issue report created (category/status only in audit);
- recovery eligibility established;
- same-form resume;
- successor recovery created/activated;
- recovery failure reason code when operationally useful and safe.

Routine per-keystroke/per-autosave activity should not flood the general audit ledger. Draft revision persistence itself provides the operational truth; security-relevant conflicts may be audited with metadata only.

## Worker recovery UX

The Worker assessment experience must make recovery understandable without changing the one-question model.

Required behavior:

- one question remains visible at a time;
- current answer controls remain the six existing M2.07 types;
- exact in-progress editable input is recoverable even when not yet commit-valid;
- save status is truthful (`Saving…`, `Saved`, or `Offline — saved on this device`);
- Next/final Submit remains visually distinct from autosave;
- no Previous/backtracking control is introduced;
- Emergency Exit is always actionable;
- Report Technical Issue is actionable and supports continue/exit;
- reload/reconnect restores current server state instead of resetting the assessment;
- same-form recovery restores the current question and recoverable draft;
- stale-tab conflicts are explicit rather than silent;
- submitted/superseded attempts cannot be reopened by stale browser state;
- replacement recovery, when required, clearly tells the Worker that recovery moved to a new controlled attempt without exposing hidden questions or scoring semantics.

## Testing contract

Implementation follows strict RED -> GREEN -> REFACTOR TDD. No production migration/service/UI behavior is added until the corresponding automated test has failed for the expected missing-behavior reason.

Required RED coverage includes:

### Draft and commit separation

- draft autosave for all six question types;
- empty/cleared/unselected draft state persists without resurrecting an older value;
- exact partial integer/decimal input such as `-` or `1.` survives autosave/recovery while remaining uncommittable until valid;
- short/long text draft preserves exact editable whitespace while final commit still applies M2.07 normalization;
- draft shape/bounds are enforced without requiring final commit validity;
- autosave does not insert a committed answer;
- autosave does not advance `currentPosition`;
- Next/Submit rejects incomplete draft without deleting it;
- Next/Submit still commits exactly once before progression;
- successful commit deletes the matching server draft transactionally;
- failed commit/progression preserves recoverable draft state;
- no Previous/committed-answer mutation path appears.

### Reload, crash, offline, reconnect

- written short/long text survives refresh through server draft;
- same-device unsynced typing survives simulated reload/crash through encrypted local storage;
- offline local save reports truthful offline state;
- reconnect flushes against the expected server revision;
- cross-device recovery receives server draft without needing the original device key;
- obsolete local records cannot populate a different current position/question;
- local cleanup after commit, submit, explicit logout, and replacement.

### Concurrency

- stale autosave revision cannot overwrite newer server draft;
- retry of latest accepted mutation is idempotent;
- reused latest idempotency key with different content fails;
- older delayed requests fail stale without overwriting newer data;
- two tabs cannot silently last-write-win;
- explicit conflict reconciliation succeeds only against latest revision;
- stale tab cannot advance after another tab/device has committed.

### Interruption and recovery

- Emergency Exit remains functional with healthy server;
- Emergency Exit still exits safely when server save/interruption call fails;
- explicit interruption transition is idempotent;
- only server-authorized recovery reaches `RECOVERABLE`;
- same-form resume returns to `IN_PROGRESS` with identical current question/form;
- reload/crash of an otherwise valid `IN_PROGRESS` attempt recovers without fabricating an interruption event;
- session expiry/revocation blocks recovery mutations until valid reauthentication;
- submitted attempt cannot enter recovery lifecycle.

### Technical issue reporting

- report-and-continue records bounded report data and leaves lifecycle unchanged;
- report-and-exit protects draft, records/queues report, and exits;
- offline report retry is idempotent;
- system-generated report/audit payloads never attach current answer/draft, answer key, rubric, scoring, or hidden form content;
- audit/timeline excludes free-text issue description.

### Replacement recovery

- replacement is server-controlled and exceptional;
- predecessor remains immutable historical state;
- successor lineage is unique and same-Worker/same-case;
- case active reference moves atomically;
- successor excludes every prohibited previously exposed/generated Worker question according to the strongest existing non-repeat rule;
- currently displayed but uncommitted question is not repeated;
- insufficient fresh-question capacity fails closed rather than reusing a question;
- predecessor and successor cannot both progress concurrently.

### Security and regression

- cross-Worker draft/read/save/recover/report/replace probes fail closed;
- company/reviewer/assessor/admin direct calls fail closed;
- response/HTML/local payload checks find no answer keys, rubrics, scoring, future questions, or complete form arrays;
- local recovery data is not displayed to a different authenticated Worker in the same browser profile;
- existing M2.07 one-question browser flow remains green;
- M2.07 append-only committed-answer DB protections remain green;
- migration rollback/reapply is verified;
- targeted tests, browser tests, full Engineering Gate, and permanent Independent full-system audit are green on the exact implementation PR head.

## Acceptance criteria

M2.08 is complete only when a real authenticated Worker can type on the current question and recover the exact uncommitted input, including incomplete/cleared edit states, through refresh/crash/connectivity interruption without it becoming a committed answer; server draft state arbitrates cross-device recovery and stale writers; device-local encryption protects unsynced same-device work; Emergency Exit and Report Technical Issue are functional even under failure conditions; same-form recovery preserves immutable M2.07 history by default; exceptional replacement preserves lineage and the strongest never-repeat rule; submitted/foreign/superseded attempts cannot be revived; no recovery surface adds hidden assessment/scoring data; and the exact implementation head passes targeted RED-derived tests, real browser regression, the full Engineering Gate, and the permanent Independent full-system audit.
