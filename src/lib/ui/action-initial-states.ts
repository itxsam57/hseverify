export const INITIAL_COMPANY_ORGANIZATION_ACTION_STATE = Object.freeze({
  status: "idle" as const,
  message: null
});

export const INITIAL_COMPANY_TEAM_ACTION_STATE = Object.freeze({
  status: "idle" as const,
  message: null,
  invitationPath: null
});

export const INITIAL_COMPANY_VERIFICATION_ACTION_STATE = Object.freeze({
  status: "idle" as const,
  message: null,
  fieldErrors: Object.freeze({} as Readonly<Record<string, string>>)
});

export const INITIAL_PUBLIC_VERIFICATION_ACTION_STATE = Object.freeze({
  status: "idle" as const,
  message: null
});
