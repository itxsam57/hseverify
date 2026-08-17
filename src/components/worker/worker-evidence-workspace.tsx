"use client";

import { useActionState } from "react";

import {
  createWorkerEvidenceRecordAction,
  endWorkerEmploymentAction,
  inactivateWorkerSkillAction,
  saveWorkerEvidenceDraftAction,
  startWorkerEvidenceRevisionAction,
  submitWorkerEvidenceAction,
  uploadWorkerEvidenceFileAction,
  uploadWorkerLeavingLetterAction
} from "@/app/worker/(portal)/evidence/actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  CheckboxField,
  Field,
  Input,
  Select,
  Textarea
} from "@/components/ui/field";
import { INITIAL_WORKER_EVIDENCE_ACTION_STATE } from "@/lib/worker-evidence/worker-evidence-action-state";
import type {
  EmploymentDetails,
  ExperienceDetails,
  QualificationDetails,
  SkillDetails,
  WorkerEvidenceRecord,
  WorkerEvidenceVersion
} from "@/lib/worker-evidence/worker-evidence-domain";

type WorkspaceAttachment = Readonly<{
  attachmentId: string;
  recordId: string;
  versionId: string;
  attachmentKind: string;
  secureFileId: string;
  displayFilename: string;
  createdAt: string;
  supersededAt: string | null;
}>;

type WorkspaceLeavingLetter = Readonly<{
  leavingLetterId: string;
  employmentRecordId: string;
  employmentVersionId: string;
  secureFileId: string;
  displayFilename: string;
  status: "active" | "superseded";
  supersedesLeavingLetterId: string | null;
  createdAt: string;
  supersededAt: string | null;
}>;

export type WorkerEvidenceWorkspaceRecord = Omit<
  WorkerEvidenceRecord,
  "workerAccountId"
> &
  Readonly<{
    attachments: readonly WorkspaceAttachment[];
    leavingLetters: readonly WorkspaceLeavingLetter[];
    versions: readonly WorkerEvidenceVersion[];
  }>;

function Feedback({
  state
}: {
  state: typeof INITIAL_WORKER_EVIDENCE_ACTION_STATE;
}): React.JSX.Element | null {
  if (!state.message) return null;
  return (
    <Alert
      tone={
        state.status === "success"
          ? "success"
          : state.status === "conflict"
            ? "warning"
            : "danger"
      }
    >
      {state.message}
    </Alert>
  );
}

function CreateRecordForm(): React.JSX.Element {
  const [state, action, pending] = useActionState(
    createWorkerEvidenceRecordAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  return (
    <section className="panel page-section content-stack">
      <div>
        <p className="eyebrow">Add evidence</p>
        <h2>Create a Worker record</h2>
        <p className="muted-copy">
          Start a separate versioned record. Records are never silently deleted or merged into another form.
        </p>
      </div>
      <Feedback state={state} />
      <form action={action} className="profile-form">
        <Field htmlFor="worker-evidence-new-kind" label="Record type">
          <Select id="worker-evidence-new-kind" name="kind" defaultValue="qualification">
            <option value="qualification">Qualification</option>
            <option value="experience">Experience</option>
            <option value="employment">Employment</option>
            <option value="skill">Skill</option>
          </Select>
        </Field>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create draft"}
        </Button>
      </form>
    </section>
  );
}

function QualificationFields({
  details
}: {
  details: QualificationDetails;
}): React.JSX.Element {
  return (
    <>
      <div className="profile-form-grid">
        <Field htmlFor="qualification-title" label="Qualification title">
          <Input id="qualification-title" name="title" defaultValue={details.title ?? ""} maxLength={240} />
        </Field>
        <Field htmlFor="qualification-category" label="Category">
          <Input id="qualification-category" name="category" defaultValue={details.category ?? ""} maxLength={160} />
        </Field>
        <Field htmlFor="qualification-issuer" label="Issuing organization">
          <Input id="qualification-issuer" name="issuingOrganization" defaultValue={details.issuingOrganization ?? ""} maxLength={240} />
        </Field>
        <Field htmlFor="qualification-provider" label="Learning provider" optional>
          <Input id="qualification-provider" name="learningProvider" defaultValue={details.learningProvider ?? ""} maxLength={240} />
        </Field>
        <Field htmlFor="qualification-number" label="Certificate / candidate number">
          <Input id="qualification-number" name="certificateNumber" defaultValue={details.certificateNumber ?? ""} maxLength={160} />
        </Field>
        <Field htmlFor="qualification-level" label="Level">
          <Input id="qualification-level" name="level" defaultValue={details.level ?? ""} maxLength={120} />
        </Field>
        <Field htmlFor="qualification-issue-date" label="Issue date">
          <Input id="qualification-issue-date" name="issueDate" type="date" defaultValue={details.issueDate ?? ""} />
        </Field>
        <Field htmlFor="qualification-expiry-date" label="Expiry date" optional>
          <Input id="qualification-expiry-date" name="expiryDate" type="date" defaultValue={details.expiryDate ?? ""} />
        </Field>
        <Field htmlFor="qualification-country" label="Country">
          <Input id="qualification-country" name="country" defaultValue={details.country ?? ""} maxLength={120} />
        </Field>
        <Field htmlFor="qualification-url" label="Verification URL" optional>
          <Input id="qualification-url" name="verificationUrl" type="url" defaultValue={details.verificationUrl ?? ""} maxLength={500} />
        </Field>
      </div>
      <CheckboxField
        name="declarationAccepted"
        defaultChecked={details.declarationAccepted}
        label="I confirm these qualification details and the attached certificate belong to me and are accurate."
      />
    </>
  );
}

function ExperienceFields({
  details
}: {
  details: ExperienceDetails;
}): React.JSX.Element {
  return (
    <div className="profile-form-grid">
      <Field htmlFor="experience-company" label="Company / organization">
        <Input id="experience-company" name="companyName" defaultValue={details.companyName ?? ""} maxLength={240} />
      </Field>
      <Field htmlFor="experience-role" label="Role / activity">
        <Input id="experience-role" name="roleTitle" defaultValue={details.roleTitle ?? ""} maxLength={240} />
      </Field>
      <Field htmlFor="experience-country" label="Country">
        <Input id="experience-country" name="country" defaultValue={details.country ?? ""} maxLength={120} />
      </Field>
      <Field htmlFor="experience-status" label="Status">
        <Select id="experience-status" name="status" defaultValue={details.status}>
          <option value="current">Current</option>
          <option value="ended">Ended</option>
        </Select>
      </Field>
      <Field htmlFor="experience-start" label="Start date">
        <Input id="experience-start" name="startDate" type="date" defaultValue={details.startDate ?? ""} />
      </Field>
      <Field htmlFor="experience-end" label="End date" optional>
        <Input id="experience-end" name="endDate" type="date" defaultValue={details.endDate ?? ""} />
      </Field>
      <Field htmlFor="experience-duties" label="Duties / experience detail" optional className="profile-field-wide">
        <Textarea id="experience-duties" name="duties" defaultValue={details.duties ?? ""} maxLength={4000} rows={5} />
      </Field>
    </div>
  );
}

function EmploymentFields({
  details
}: {
  details: EmploymentDetails;
}): React.JSX.Element {
  return (
    <div className="profile-form-grid">
      <input type="hidden" name="status" value="current" />
      <Field htmlFor="employment-company" label="Employer">
        <Input id="employment-company" name="companyName" defaultValue={details.companyName ?? ""} maxLength={240} />
      </Field>
      <Field htmlFor="employment-role" label="Role title">
        <Input id="employment-role" name="roleTitle" defaultValue={details.roleTitle ?? ""} maxLength={240} />
      </Field>
      <Field htmlFor="employment-country" label="Country">
        <Input id="employment-country" name="country" defaultValue={details.country ?? ""} maxLength={120} />
      </Field>
      <Field htmlFor="employment-start" label="Start date">
        <Input id="employment-start" name="startDate" type="date" defaultValue={details.startDate ?? ""} />
      </Field>
      <Field htmlFor="employment-duties" label="Duties" optional className="profile-field-wide">
        <Textarea id="employment-duties" name="duties" defaultValue={details.duties ?? ""} maxLength={4000} rows={5} />
      </Field>
    </div>
  );
}

function SkillFields({ details }: { details: SkillDetails }): React.JSX.Element {
  return (
    <div className="profile-form-grid">
      <Field htmlFor="skill-name" label="Skill">
        <Input id="skill-name" name="skillName" defaultValue={details.skillName ?? ""} maxLength={240} />
      </Field>
      <Field htmlFor="skill-category" label="Category">
        <Input id="skill-category" name="category" defaultValue={details.category ?? ""} maxLength={160} />
      </Field>
      <Field htmlFor="skill-proficiency" label="Proficiency claim">
        <Input id="skill-proficiency" name="proficiencyClaim" defaultValue={details.proficiencyClaim ?? ""} maxLength={160} />
      </Field>
      <Field htmlFor="skill-months" label="Experience (months)">
        <Input id="skill-months" name="experienceMonths" type="number" min={0} step={1} defaultValue={details.experienceMonths ?? ""} />
      </Field>
      <Field htmlFor="skill-trade" label="Related trade" optional>
        <Input id="skill-trade" name="relatedTrade" defaultValue={details.relatedTrade ?? ""} maxLength={160} />
      </Field>
      <div className="ds-field">
        <span className="ds-field-label">Assurance state</span>
        <p className="muted-copy">{details.assuranceStatus.replaceAll("_", " ")}</p>
      </div>
    </div>
  );
}

function DraftMetadataForm({
  record
}: {
  record: WorkerEvidenceWorkspaceRecord;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(
    saveWorkerEvidenceDraftAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  return (
    <form action={action} className="profile-form" noValidate>
      <input type="hidden" name="recordId" value={record.recordId} />
      <input type="hidden" name="expectedRevision" value={record.currentVersion.revision} />
      {record.kind === "qualification" ? (
        <QualificationFields details={record.currentVersion.details as QualificationDetails} />
      ) : record.kind === "experience" ? (
        <ExperienceFields details={record.currentVersion.details as ExperienceDetails} />
      ) : record.kind === "employment" ? (
        <EmploymentFields details={record.currentVersion.details as EmploymentDetails} />
      ) : (
        <SkillFields details={record.currentVersion.details as SkillDetails} />
      )}
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save metadata"}
      </Button>
    </form>
  );
}

function EvidenceFileForm({
  record
}: {
  record: WorkerEvidenceWorkspaceRecord;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(
    uploadWorkerEvidenceFileAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  const kind =
    record.kind === "qualification"
      ? "primary_certificate"
      : record.kind === "experience"
        ? "experience_evidence"
        : record.kind === "employment"
          ? "employment_evidence"
          : "skill_evidence";
  const active = record.attachments.find(
    (item) =>
      item.versionId === record.currentVersion.versionId &&
      item.attachmentKind === kind &&
      item.supersededAt === null
  );

  return (
    <section className="content-stack" aria-label={`${record.kind} file evidence`}>
      <div>
        <h4>{record.kind === "qualification" ? "Qualification certificate and evidence" : "File evidence"}</h4>
        <p className="muted-copy">
          PDF, PNG or JPEG up to 10 MB. Files are quarantined and security-scanned before they can bind to this exact version.
        </p>
      </div>
      <Feedback state={state} />
      <form action={action} className="profile-form" encType="multipart/form-data">
        <input type="hidden" name="recordId" value={record.recordId} />
        <input type="hidden" name="versionId" value={record.currentVersion.versionId} />
        <input type="hidden" name="expectedActiveAttachmentId" value={active?.attachmentId ?? ""} />
        {record.kind === "qualification" ? (
          <Field htmlFor={`qualification-attachment-kind-${record.recordId}`} label="Qualification file purpose">
            <Select
              id={`qualification-attachment-kind-${record.recordId}`}
              name="attachmentKind"
              defaultValue="primary_certificate"
            >
              <option value="primary_certificate">Primary certificate</option>
              <option value="supporting_evidence">Supporting evidence</option>
            </Select>
          </Field>
        ) : null}
        <Field htmlFor={`evidence-file-${record.recordId}`} label="Evidence file">
          <Input
            id={`evidence-file-${record.recordId}`}
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            required
          />
        </Field>
        <Button type="submit" disabled={pending} variant="secondary">
          {pending ? "Scanning and attaching…" : active ? "Replace active file" : "Upload and attach file"}
        </Button>
      </form>
    </section>
  );
}

function SubmitForm({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  const [state, action, pending] = useActionState(
    submitWorkerEvidenceAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  return (
    <form action={action} className="content-stack">
      <input type="hidden" name="recordId" value={record.recordId} />
      <input type="hidden" name="expectedRevision" value={record.currentVersion.revision} />
      <Feedback state={state} />
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit this version"}
      </Button>
    </form>
  );
}

function StartRevisionForm({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  const [state, action, pending] = useActionState(
    startWorkerEvidenceRevisionAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  return (
    <form action={action} className="content-stack">
      <input type="hidden" name="recordId" value={record.recordId} />
      <input type="hidden" name="expectedRevision" value={record.currentVersion.revision} />
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Starting revision…" : "Start a new revision"}
      </Button>
    </form>
  );
}

function EndEmploymentForm({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  const [state, action, pending] = useActionState(
    endWorkerEmploymentAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  return (
    <form action={action} className="profile-form">
      <input type="hidden" name="recordId" value={record.recordId} />
      <input type="hidden" name="expectedRevision" value={record.currentVersion.revision} />
      <Field htmlFor={`employment-end-date-${record.recordId}`} label="Employment end date">
        <Input id={`employment-end-date-${record.recordId}`} name="endDate" type="date" required />
      </Field>
      <Field htmlFor={`employment-end-reason-${record.recordId}`} label="End reason" optional>
        <Textarea id={`employment-end-reason-${record.recordId}`} name="endReason" maxLength={1000} rows={3} />
      </Field>
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Ending employment…" : "End employment and preserve history"}
      </Button>
    </form>
  );
}

function InactivateSkillForm({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  const [state, action, pending] = useActionState(
    inactivateWorkerSkillAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  return (
    <form action={action} className="content-stack">
      <input type="hidden" name="recordId" value={record.recordId} />
      <input type="hidden" name="expectedRevision" value={record.currentVersion.revision} />
      <Feedback state={state} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Updating…" : "Mark skill inactive"}
      </Button>
    </form>
  );
}

function LeavingLetterForm({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  const [state, action, pending] = useActionState(
    uploadWorkerLeavingLetterAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  const active = record.leavingLetters.find((letter) => letter.status === "active");
  return (
    <section className="content-stack" aria-label="Leaving letter">
      <div>
        <h4>Leaving letter</h4>
        <p className="muted-copy">
          Attach the leaving letter to this exact ended employment. Replacements preserve the previous letter in history.
        </p>
      </div>
      <Feedback state={state} />
      <form action={action} className="profile-form" encType="multipart/form-data">
        <input type="hidden" name="recordId" value={record.recordId} />
        <input type="hidden" name="versionId" value={record.currentVersion.versionId} />
        <input type="hidden" name="expectedActiveLeavingLetterId" value={active?.leavingLetterId ?? ""} />
        <Field htmlFor={`leaving-letter-${record.recordId}`} label="Leaving letter file">
          <Input
            id={`leaving-letter-${record.recordId}`}
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            required
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? "Scanning and attaching…" : active ? "Replace leaving letter" : "Upload leaving letter"}
        </Button>
      </form>
    </section>
  );
}

function History({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  return (
    <section className="content-stack" aria-label={`${record.kind} history`}>
      <h4>Version and file history</h4>
      <div className="content-stack">
        {record.versions.map((version) => (
          <p className="muted-copy" key={version.versionId}>
            Version {version.versionNumber} · revision {version.revision} · {version.status.replaceAll("_", " ")}
            {version.submittedAt ? ` · submitted ${new Date(version.submittedAt).toLocaleString()}` : ""}
          </p>
        ))}
        {record.attachments.map((attachment) => (
          <p className="muted-copy" key={attachment.attachmentId}>
            {attachment.displayFilename} · {attachment.attachmentKind.replaceAll("_", " ")} · {attachment.supersededAt ? "superseded" : "active"}
          </p>
        ))}
        {record.leavingLetters.map((letter) => (
          <p className="muted-copy" key={letter.leavingLetterId}>
            Leaving letter: {letter.displayFilename} · {letter.status}
          </p>
        ))}
      </div>
    </section>
  );
}

function RecordCard({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {
  const editable = record.currentVersion.status === "draft";
  const submitted = record.currentVersion.status === "submitted";
  const canRevise = submitted && record.lifecycleStatus === "active";

  return (
    <article className="panel page-section content-stack">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">{record.kind}</p>
          <h3>{record.kind[0].toUpperCase()}{record.kind.slice(1)} record</h3>
          <p className="muted-copy">
            Version {record.currentVersion.versionNumber} · revision {record.currentVersion.revision} · updated {new Date(record.updatedAt).toLocaleString()}
          </p>
        </div>
        <span className="status-pill">
          {record.lifecycleStatus} · {record.currentVersion.status}
        </span>
      </div>

      {editable ? (
        <>
          <DraftMetadataForm record={record} />
          <EvidenceFileForm record={record} />
          <SubmitForm record={record} />
        </>
      ) : null}

      {canRevise ? <StartRevisionForm record={record} /> : null}
      {record.kind === "employment" && submitted && record.lifecycleStatus === "active" ? (
        <EndEmploymentForm record={record} />
      ) : null}
      {record.kind === "skill" && submitted && record.lifecycleStatus === "active" ? (
        <InactivateSkillForm record={record} />
      ) : null}
      {record.kind === "employment" && submitted && record.lifecycleStatus === "ended" ? (
        <LeavingLetterForm record={record} />
      ) : null}

      <History record={record} />
    </article>
  );
}

export function WorkerEvidenceWorkspace({
  records
}: {
  records: readonly WorkerEvidenceWorkspaceRecord[];
}): React.JSX.Element {
  const qualificationCount = records.filter((record) => record.kind === "qualification").length;
  const experienceCount = records.filter((record) => record.kind === "experience").length;
  const employmentCount = records.filter((record) => record.kind === "employment").length;
  const skillCount = records.filter((record) => record.kind === "skill").length;

  return (
    <div className="content-stack">
      <CreateRecordForm />

      <section className="page-section content-stack" aria-labelledby="worker-evidence-records-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Versioned Worker evidence</p>
            <h2 id="worker-evidence-records-heading">Your evidence records</h2>
            <p className="muted-copy">
              Qualification {qualificationCount} · Experience {experienceCount} · Employment {employmentCount} · Skill {skillCount}
            </p>
          </div>
          <span className="status-pill">{records.length}</span>
        </div>
        {records.length ? (
          records.map((record) => <RecordCard key={record.recordId} record={record} />)
        ) : (
          <Alert tone="neutral">
            No evidence records yet. Create a qualification, experience, employment or skill draft above.
          </Alert>
        )}
      </section>
    </div>
  );
}
