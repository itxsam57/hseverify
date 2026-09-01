import Link from "next/link";

import { beginAssessmentAction } from "@/app/worker/(portal)/available-assessments/actions";
import { Button } from "@/components/ui/button";
import { getAssessmentAttemptService } from "@/lib/assessment-attempt/assessment-attempt-service";
import { requirePlatformPermission } from "@/lib/authorization/authorization-service";
import { getAssessmentCatalogueEligibilityService } from "@/lib/assessment-catalogue/assessment-catalogue-eligibility-service";

export const dynamic = "force-dynamic";

export default async function AvailableAssessmentsPage(): Promise<React.JSX.Element> {
  const principal = await requirePlatformPermission({
    expectedRole: "worker",
    permission: "worker.assessments.read"
  });
  const eligibilityService = await getAssessmentCatalogueEligibilityService();
  const attemptService = await getAssessmentAttemptService();
  const [available, inProgress] = await Promise.all([
    eligibilityService.listAvailableForWorker(principal),
    attemptService.listOwnedInProgress(principal)
  ]);

  return (
    <section className="page-stack" aria-labelledby="available-assessments-heading">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Assessment eligibility</p>
          <h1 id="available-assessments-heading">Available assessments</h1>
          <p>
            This page is read-only. Resume an assessment already in progress, or start a new one only
            when your own pending assurance case and verified qualification evidence are eligible.
          </p>
        </div>
      </div>

      <section className="content-stack" aria-labelledby="in-progress-assessments-heading">
        <div className="section-heading-row">
          <div>
            <p className="eyebrow">Continue safely</p>
            <h2 id="in-progress-assessments-heading">In progress</h2>
          </div>
          <span className="status-pill">{inProgress.length}</span>
        </div>

        {inProgress.length === 0 ? (
          <section className="panel page-section" aria-label="No assessments in progress">
            <p className="muted-copy">You do not currently have an assessment to resume.</p>
          </section>
        ) : (
          <div className="content-stack">
            {inProgress.map((assessment) => (
              <article className="panel page-section" key={assessment.attemptId}>
                <div className="section-heading-row">
                  <div>
                    <p className="eyebrow">{assessment.catalogueReference}</p>
                    <h3>{assessment.title}</h3>
                  </div>
                  <span className="status-pill">
                    Question {assessment.currentPosition} of {assessment.questionCount}
                  </span>
                </div>
                {assessment.description ? <p>{assessment.description}</p> : null}
                <p className="muted-copy">
                  Your latest server-confirmed draft for the current question will be restored when
                  you resume. This listing does not expose the draft itself.
                </p>
                <Link
                  className="ds-button ds-button-primary"
                  href={`/worker/assessments/${assessment.attemptId}`}
                >
                  Resume assessment
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

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
              <form action={beginAssessmentAction} className="content-stack">
                <input type="hidden" name="caseId" value={assessment.caseId} />
                <input
                  type="hidden"
                  name="catalogueVersionId"
                  value={assessment.catalogueVersionId}
                />
                <p className="muted-copy">
                  Starting creates or reuses your protected attempt and opens only the first current
                  question. Later questions are not delivered until the current answer is saved.
                </p>
                <Button type="submit">Start assessment</Button>
              </form>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
