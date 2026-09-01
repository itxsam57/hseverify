import "server-only";

import type { AuthorizationPrincipal } from "../authorization/authorization-context-domain";
import { evaluatePlatformPermission } from "../authorization/authorization-domain";
import type { DatabaseClient } from "../database/database";
import { AssessmentAttemptAccessError } from "./assessment-attempt-domain";

export async function assertLiveAssessmentWorker(
  database: DatabaseClient,
  principal: AuthorizationPrincipal,
  now: Date
): Promise<void> {
  const decision = evaluatePlatformPermission({
    role: principal.activeRole,
    permission: "worker.assessments.read"
  });
  if (
    principal.activeRole !== "worker" ||
    principal.accountStatus !== "active" ||
    !decision.allowed ||
    principal.tenantMembership !== null
  ) {
    throw new AssessmentAttemptAccessError();
  }

  const current = await database.query<{ session_id: string }>(
    `SELECT s.session_id
     FROM auth_sessions s
     JOIN auth_accounts a ON a.account_id=s.account_id
     JOIN auth_account_roles r
       ON r.account_id=a.account_id
      AND r.role='worker'
     WHERE s.session_id=$1
       AND s.account_id=$2
       AND s.active_role='worker'
       AND s.revoked_at IS NULL
       AND s.expires_at > $3
       AND a.account_status='active'
     LIMIT 1`,
    [principal.sessionId, principal.accountId, now.toISOString()]
  );
  if (current.rows[0]?.session_id !== principal.sessionId) {
    throw new AssessmentAttemptAccessError();
  }
}
