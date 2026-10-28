import type { Instrumentation } from "next";

/** Next calls this on every server error (pages and API routes): report it to the admin. */
export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { reportServerError } = await import("@/lib/monitoring/reportError");
  await reportServerError(error, request.path, (error as { digest?: string }).digest);
};
