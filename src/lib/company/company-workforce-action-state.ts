export type WorkerCompanyAccessActionState = Readonly<{
  status: "idle" | "success" | "error" | "conflict";
  message: string | null;
}>;

export const INITIAL_WORKER_COMPANY_ACCESS_ACTION_STATE: WorkerCompanyAccessActionState = Object.freeze({
  status: "idle",
  message: null
});
