import type { DashboardTone } from "@/lib/worker/dashboard-types";

export function StatusBadge({
  label,
  tone = "neutral"
}: {
  label: string;
  tone?: DashboardTone;
}): React.JSX.Element {
  return <span className={`status-badge status-${tone}`}>{label}</span>;
}
