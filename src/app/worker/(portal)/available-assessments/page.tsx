import { requirePlatformPermission } from "@/lib/authorization/authorization-service";
import { getAssessmentCatalogueEligibilityService } from "@/lib/assessment-catalogue/assessment-catalogue-eligibility-service";

export const dynamic = "force-dynamic";

export default async function AvailableAssessmentsPage(): Promise<React.JSX.Element> {
  const principal = await requirePlatformPermission({
    expectedRole: "worker",
    permission: "worker.assessments.read"
  });
  const available = await (
    await getAssessmentCatalogueEligibilityService()
  ).listAvailableForWorker(principal);

  return (
    <section className="page-stack" aria-labelledby="available-assessments-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Assessment eligibility</p>
          <h1 id="available-assessments-heading">Available assessments</h1>
          <p>
            This list is calculated from your own Assessment pending assurance cases, their locked
            framework policy and your approved current qualification evidence. Viewing this page is
            read-only and does not create an assessment form or attempt.
          </p>
        </div>
      </div>

      {available.length === 0 ? (
        <section className="panel page-section" aria-label="No available assessments">
          <h2>No assessments are currently available.</h2>
          <p className="muted-copy">
            An assessment appears here only when an owned assurance case is ready and every
            configured eligibility requirement is satisfied. No action is required on this page
            while the list is empty.
          </p>
        </section>
      ) : (
        <section className="content-stack" aria-label="Eligible assessment offerings">
          {available.map((assessment) => (
            <article className="panel page-section" key={`${assessment.caseId}-${assessment.catalogueVersionId}`}>
              <div className="section-heading-row">
                <div>
                  <p className="eyebrow">{assessment.catalogueReference}</p>
                  <h2>{assessment.title}</h2>
                </div>
                <span className="status-pill">Eligible</span>
              </div>
              {assessment.description ? <p>{assessment.description}</p> : null}
              <dl>
                <div>
                  <dt>Assurance case</dt>
                  <dd><code>{assessment.caseId}</code></dd>
                </div>
                <div>
                  <dt>Verified qualifications</dt>
                  <dd>
                    {assessment.verifiedQualificationCount} / {assessment.minimumVerifiedQualifications} required
                  </dd>
                </div>
                <div>
                  <dt>Framework</dt>
                  <dd><code>{assessment.frameworkId}</code></dd>
                </div>
              </dl>
              <p className="muted-copy">
                Assessment launch is intentionally unavailable in M2.06. A later authorized
                assessment-attempt workflow must create the actual attempt before any questions can
                be delivered.
              </p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
