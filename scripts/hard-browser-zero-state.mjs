import { PGlite } from "@electric-sql/pglite";

const dataDirectory = process.env.HSE_PGLITE_DATA_DIR;
if (!dataDirectory) throw new Error("HSE_PGLITE_DATA_DIR is required for hard-browser zero-state diagnostics.");

const database = await PGlite.create(dataDirectory);
try {
  const rootRoles = await database.query(
    "SELECT COUNT(*)::int AS count FROM auth_account_roles WHERE role = 'root'"
  );
  const invitations = await database.query(
    "SELECT COUNT(*)::int AS count FROM auth_staff_invitations"
  );
  const accounts = await database.query(
    "SELECT COUNT(*)::int AS count FROM auth_accounts"
  );

  const state = {
    rootRoleAssignments: rootRoles.rows[0]?.count ?? -1,
    staffInvitations: invitations.rows[0]?.count ?? -1,
    accounts: accounts.rows[0]?.count ?? -1,
    sandboxEnabled: process.env.HSE_ENABLE_AUTH_SANDBOX === "true",
    sandboxKeyPresent: Boolean(process.env.HSE_AUTH_SANDBOX_ACCESS_KEY)
  };

  console.log(`HARD_BROWSER_ZERO_STATE ${JSON.stringify(state)}`);

  if (
    state.rootRoleAssignments !== 0 ||
    state.staffInvitations !== 0 ||
    state.accounts !== 0 ||
    !state.sandboxEnabled ||
    !state.sandboxKeyPresent
  ) {
    throw new Error(`Hard-browser environment is not a clean bootstrap state: ${JSON.stringify(state)}`);
  }
} finally {
  await database.close();
}
