import type { ResidentNotification } from "@/lib/buildings/notifications";
import type { CodeHistory, Feed } from "@/lib/offers/types";
import type { IssuedToken, TokenStatus } from "@/lib/qr/types";
import { apiFetch, type ApiError } from "./http";

/** My building's feed: offers with this month's state, categories, savings. */
export const fetchFeed = (token: string) => apiFetch<Feed>("/api/me/offers", { token });

/** A fresh 5-minute QR + backup code for a business (replaces my apartment's previous one there). */
export const issueToken = (token: string, businessId: string) => apiFetch<IssuedToken>("/api/me/tokens", { token, body: { businessId } });

/** Where my QR stands (polled while it is on screen, to move to the Done screen when the register approves it). */
export const fetchTokenStatus = (token: string, tokenId: string) => apiFetch<TokenStatus>(`/api/me/tokens/${tokenId}`, { token });

/** My apartment's redemptions ("my benefits") and savings. */
export const fetchCodeHistory = (token: string) => apiFetch<CodeHistory>("/api/me/codes", { token });

/** Reports that a redemption's recorded amount is wrong (multipart: the receipt photo is optional). */
export async function reportDispute(
  token: string,
  input: { redemptionId: string; reason: string; claimedBill: string; note: string; photo: Blob | null },
): Promise<{ ok: true } | ApiError & { errors?: Record<string, string> }> {
  const form = new FormData();
  form.append("redemptionId", input.redemptionId);
  form.append("reason", input.reason);
  form.append("claimedBill", input.claimedBill);
  form.append("note", input.note);
  if (input.photo) form.append("photo", input.photo, "receipt.jpg");
  try {
    const res = await fetch("/api/me/disputes", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { ok: true } : { error: json.error ?? "השליחה נכשלה. נסו שוב.", errors: json.errors, unauthorized: res.status === 401 };
  } catch {
    return { error: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב." };
  }
}

/** Lobby announcements for my building, city or everyone. */
export const fetchNotifications = (token: string) => apiFetch<ResidentNotification[]>("/api/me/notifications", { token });
