import type { JoinErrors } from "@/lib/businesses/validateJoin";
import { apiFetch, type ApiError } from "./http";

export type JoinResponse = { verifyUrl: string } | ({ errors: JoinErrors } & ApiError) | ApiError;

/** Submits the onboarding form to POST /api/businesses. */
export const submitJoin = (input: Record<string, unknown>) =>
  apiFetch<{ verifyUrl: string }>("/api/businesses", { body: input }) as Promise<JoinResponse>;
