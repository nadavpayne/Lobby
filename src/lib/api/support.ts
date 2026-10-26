import type { SupportErrors } from "@/lib/support/validate";
import { apiFetch, type ApiError } from "./http";

/** Sends the contact form (with the session token when signed in, so the request is linked to the account). */
export const sendSupportRequest = (body: Record<string, string>, token?: string) =>
  apiFetch<{ ok: true }>("/api/support", { token, body }) as Promise<{ ok: true } | (ApiError & { errors?: SupportErrors })>;
