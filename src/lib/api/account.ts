import type { AccountDeletionInfo } from "@/lib/account/deleteAccount";
import { apiFetch } from "./http";

/** What deleting my account means, and who could take over the committee. */
export const fetchDeletionInfo = (token: string) => apiFetch<AccountDeletionInfo>("/api/account", { token });

/** Deletes my account now, with the fresh email code (re-authentication). */
export const deleteMyAccount = (token: string, code: string, handoverTo: string | null) =>
  apiFetch<{ ok: true }>("/api/account", { token, body: { action: "delete", code, handoverTo } });
