import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDateTime } from "@/lib/format";
import { getPublicWorkerProjection } from "@/lib/worker/dashboard-repository";

export default async function PublicWorkerProjectionPage({
  params
}: {
  params: Promise<{ workerId: string }>;
}): Promise<React.JSX.Element> {
  const { workerId } = await params;
  const projection = await getPublicWorkerProjection(workerId);
  if (!projection) {
    notFound();
  }

  return (
    <main className="public-verification-page">
      <Link className="brand-mark" href="/">
        <span className="brand-symbol" aria-hidden="true">HV</span>
        <span>HSE Verify</span>
      </Link>

      <section className="public-verification-card">
        <p className="eyebrow">Public worker projection</p>
        <h1>{projection.displayName}</h1>
        <dl>
          <div>
            <dt>Worker ID</dt>
            <dd>{projection.workerId}</dd>
          </div>
          <div>
            <dt>Identity status</dt>
            <dd><span className="status-badge status-positive">Verified</span></dd>
          </div>
          <div>
            <dt>Verification timestamp</dt>
            <dd>{formatDateTime(projection.verifiedAt)}</dd>
          </div>
        </dl>
        <p className="public-projection-note">
          This page exposes only the fields approved for public display. It does not disclose documents, contact information, employment history, assessment answers or internal review notes.
        </p>
      </section>
    </main>
  );
}
