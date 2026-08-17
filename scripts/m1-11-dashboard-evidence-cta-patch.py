from pathlib import Path

path = Path("src/app/worker/(portal)/dashboard/page.tsx")
source = path.read_text(encoding="utf-8")

old = '''        <article className="metric-card">
          <div className="metric-card-heading">
            <span>Qualifications</span>
            <span>{dashboard.evidence.verifiedQualifications} verified</span>
          </div>
          <strong>{dashboard.evidence.pendingQualifications} pending review</strong>
          <p>{dashboard.evidence.changesRequested} submission(s) currently need changes.</p>
        </article>
'''

new = '''        <article className="metric-card">
          <div className="metric-card-heading">
            <span>Qualifications</span>
            <span>{dashboard.evidence.verifiedQualifications} verified</span>
          </div>
          <strong>{dashboard.evidence.pendingQualifications} pending review</strong>
          <p>{dashboard.evidence.changesRequested} submission(s) currently need changes.</p>
          <Link className="button button-secondary button-small" href="/worker/evidence">
            Manage evidence
          </Link>
        </article>
'''

if source.count(old) != 1:
    raise SystemExit(f"expected exactly one Qualifications metric card, found {source.count(old)}")

path.write_text(source.replace(old, new, 1), encoding="utf-8")
print("M1.11 Worker dashboard evidence CTA staged.")
