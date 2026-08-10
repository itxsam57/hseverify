import { requirePortalAuthorization } from "@/lib/authorization/authorization-service";
import { getWorkerIdentityCorrectionService } from "@/lib/identity/worker-identity-correction-service";
import { getWorkerIdentityDraftService } from "@/lib/identity/worker-identity-draft-service";
import { getWorkerIdentityEvidenceService } from "@/lib/identity/worker-identity-evidence-service";
import { getWorkerIdentityEligibilityService } from "@/lib/identity/worker-identity-eligibility-service";
import { getWorkerIdentityCheckService } from "@/lib/identity/worker-identity-check-service";
import { getWorkerIdentityService } from "@/lib/identity/worker-identity-service";
import { IdentityWorkspace } from "@/components/worker/identity-workspace";

export const dynamic = "force-dynamic";

export default async function WorkerIdentityPage(): Promise<React.JSX.Element> {
  const principal = await requirePortalAuthorization("worker");
  const identityService = getWorkerIdentityService();
  const identity = await identityService.ensureOwnDraft(principal);

  const [draft, evidence, checks, eligibility, correction] = await Promise.all([
    getWorkerIdentityDraftService().loadOwn(principal),
    getWorkerIdentityEvidenceService().list(principal),
    getWorkerIdentityCheckService().loadOwn(principal),
    getWorkerIdentityEligibilityService().loadOwnStatus(principal),
    getWorkerIdentityCorrectionService().loadOwn(principal)
  ]);

  return (
    <section className="profile-page" aria-labelledby="worker-identity-heading">
      <div className="profile-page-heading">
        <div>
          <p className="section-kicker">Worker assurance</p>
          <h1 id="worker-identity-heading">Identity</h1>
          <p className="profile-page-intro">
            Build one versioned identity record, attach private evidence and submit it for assurance.
            Submitted history is preserved; later verified-detail changes use a new correction version.
          </p>
        </div>
      </div>

      <IdentityWorkspace
        identity={identity}
        draft={draft}
        evidence={evidence}
        checks={checks}
        eligibility={eligibility}
        correction={correction}
      />
    </section>
  );
}
