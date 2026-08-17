from pathlib import Path

path = Path("src/components/worker/worker-evidence-workspace.tsx")
source = path.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    source = source.replace(old, new, 1)


replace_once(
    '''import {\n  createWorkerEvidenceRecordAction,\n  endWorkerEmploymentAction,''',
    '''import {\n  createWorkerEvidenceRecordAction,\n  endWorkerEmploymentAction,\n  finalizeWorkerEvidenceFileCandidateAction,''',
    "action import",
)

replace_once(
    '''type WorkspaceLeavingLetter = Readonly<{\n  leavingLetterId: string;\n  employmentRecordId: string;\n  employmentVersionId: string;\n  secureFileId: string;\n  displayFilename: string;\n  status: "active" | "superseded";\n  supersedesLeavingLetterId: string | null;\n  createdAt: string;\n  supersededAt: string | null;\n}>;\n\nexport type WorkerEvidenceWorkspaceRecord = Omit<''',
    '''type WorkspaceLeavingLetter = Readonly<{\n  leavingLetterId: string;\n  employmentRecordId: string;\n  employmentVersionId: string;\n  secureFileId: string;\n  displayFilename: string;\n  status: "active" | "superseded";\n  supersedesLeavingLetterId: string | null;\n  createdAt: string;\n  supersededAt: string | null;\n}>;\n\ntype WorkspacePendingCandidate = Readonly<{\n  candidateId: string;\n  recordId: string;\n  versionId: string;\n  bindingKind: string;\n  secureFileId: string;\n  displayFilename: string;\n  expectedActiveBindingId: string | null;\n  scanStatus:\n    | "reserved"\n    | "quarantined"\n    | "scan_pending"\n    | "available"\n    | "unsafe"\n    | "scan_failed";\n  createdAt: string;\n}>;\n\nexport type WorkerEvidenceWorkspaceRecord = Omit<''',
    "pending candidate type",
)

replace_once(
    '''  Readonly<{\n    attachments: readonly WorkspaceAttachment[];\n    leavingLetters: readonly WorkspaceLeavingLetter[];\n    versions: readonly WorkerEvidenceVersion[];\n  }>;''',
    '''  Readonly<{\n    attachments: readonly WorkspaceAttachment[];\n    pendingCandidates: readonly WorkspacePendingCandidate[];\n    leavingLetters: readonly WorkspaceLeavingLetter[];\n    versions: readonly WorkerEvidenceVersion[];\n  }>;''',
    "workspace record pending candidates",
)

source = source.replace(' className="profile-form" encType="multipart/form-data"', ' className="profile-form"')
if "encType=" in source:
    raise SystemExit("manual React Server Action form encoding remains")

replace_once(
    '''          {pending ? "Scanning and attaching…" : active ? "Replace active file" : "Upload and attach file"}''',
    '''          {pending ? "Uploading…" : active ? "Upload replacement" : "Upload file"}''',
    "evidence upload button copy",
)
replace_once(
    '''          {pending ? "Scanning and attaching…" : active ? "Replace leaving letter" : "Upload leaving letter"}''',
    '''          {pending ? "Uploading…" : active ? "Upload replacement leaving letter" : "Upload leaving letter"}''',
    "leaving-letter upload button copy",
)

pending_components = r'''
function PendingCandidateCard({
  candidate
}: {
  candidate: WorkspacePendingCandidate;
}): React.JSX.Element {
  const [state, action, pending] = useActionState(
    finalizeWorkerEvidenceFileCandidateAction,
    INITIAL_WORKER_EVIDENCE_ACTION_STATE
  );
  const terminalFailure =
    candidate.scanStatus === "unsafe" || candidate.scanStatus === "scan_failed";

  return (
    <div className="content-stack">
      <div>
        <p className="muted-copy">
          {candidate.displayFilename} · {candidate.bindingKind.replaceAll("_", " ")} · {candidate.scanStatus.replaceAll("_", " ")}
        </p>
        <p className="muted-copy">
          This file is not part of accepted evidence until the security scan passes and finalization succeeds.
        </p>
      </div>
      <Feedback state={state} />
      {terminalFailure ? (
        <Alert tone="danger">
          {candidate.scanStatus === "unsafe"
            ? "Security scanning marked this file unsafe. It was not attached; upload a clean replacement."
            : "Security scanning failed. It was not attached; upload the file again after the scanning service is available."}
        </Alert>
      ) : (
        <form action={action} className="content-stack">
          <input type="hidden" name="candidateId" value={candidate.candidateId} />
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Checking scan…" : "Check scan status"}
          </Button>
        </form>
      )}
    </div>
  );
}

function PendingScans({
  record
}: {
  record: WorkerEvidenceWorkspaceRecord;
}): React.JSX.Element | null {
  const candidates = record.pendingCandidates.filter(
    (candidate) => candidate.versionId === record.currentVersion.versionId
  );
  if (candidates.length === 0) return null;

  return (
    <section className="content-stack" aria-label={`${record.kind} pending security scans`}>
      <div>
        <h4>Pending security scans</h4>
        <p className="muted-copy">
          Files with a security scan pending or queued remain quarantined and do not replace accepted evidence until the scan passes.
        </p>
      </div>
      {candidates.map((candidate) => (
        <PendingCandidateCard key={candidate.candidateId} candidate={candidate} />
      ))}
    </section>
  );
}

'''
replace_once(
    '''function History({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {''',
    pending_components + '''function History({ record }: { record: WorkerEvidenceWorkspaceRecord }): React.JSX.Element {''',
    "pending scan components",
)

replace_once(
    '''      {record.kind === "employment" && submitted && record.lifecycleStatus === "ended" ? (\n        <LeavingLetterForm record={record} />\n      ) : null}\n\n      <History record={record} />''',
    '''      {record.kind === "employment" && submitted && record.lifecycleStatus === "ended" ? (\n        <LeavingLetterForm record={record} />\n      ) : null}\n\n      <PendingScans record={record} />\n      <History record={record} />''',
    "pending scans render",
)

path.write_text(source, encoding="utf-8")
print("M1.11 asynchronous scan workspace patch staged.")
