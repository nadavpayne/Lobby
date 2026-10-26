import type { BusinessStatus } from "@/lib/businesses/types";
import type { Cashier } from "@/lib/biz/cashiers";
import type { BizReach } from "@/lib/biz/reach";
import type { BizRedemption, BizTotals } from "@/lib/biz/redemptionsLog";
import type { BillingMonth, BizDashboard, BizOffer, BizProfile, Customer, OfferInput, ProfileInput } from "@/lib/biz/types";
import { apiFetch } from "./http";

// Client calls for the business owner CRM (/biz). Every route checks the owner role on the server.

export interface MyBusiness {
  name: string;
  status: BusinessStatus;
  /** owner = the full CRM; cashier = the register only. */
  role: "owner" | "cashier";
  email: string | null;
  /** The business's one photo (logo / profile picture), or null until uploaded. */
  logoUrl: string | null;
}

/** The business I own or work the register for. */
export const fetchMyBusiness = (token: string) => apiFetch<MyBusiness>("/api/biz/me", { token });

/** Dashboard numbers, daily series and top buildings. */
export const fetchDashboard = (token: string) => apiFetch<BizDashboard>("/api/biz/dashboard", { token });

/** The storefront and how many Lobby households are within 500 m / 1 km. */
export const fetchReach = (token: string) => apiFetch<BizReach>("/api/biz/reach", { token });

/** Lobby customers who redeemed here, with my notes and tags. */
export const fetchCustomers = (token: string) => apiFetch<Customer[]>("/api/biz/customers", { token });

/** Saves my note and tags for one customer. */
export const saveCustomerNote = (token: string, residentId: string, note: string, tags: string[]) =>
  apiFetch<{ ok: true }>("/api/biz/customers", { token, body: { residentId, note, tags } });

/** My offers, newest first. */
export const fetchBizOffers = (token: string) => apiFetch<BizOffer[]>("/api/biz/offers", { token });

/** Creates (no id) or edits an offer; content edits go back to Lobby for approval. */
export const saveOffer = (token: string, offer: OfferInput & { id?: string }) =>
  apiFetch<BizOffer | { error: string; errors: Record<string, string> }>("/api/biz/offers", { token, body: offer });

/** Pauses or re-activates an offer. */
export const setOfferActive = (token: string, id: string, active: boolean) =>
  apiFetch<BizOffer>("/api/biz/offers/active", { token, body: { id, active } });

/** Monthly commission statements with payment status. */
export const fetchBilling = (token: string) => apiFetch<BillingMonth[]>("/api/biz/billing", { token });

/** Business details, hours, branches and the staff terminal link. */
export const fetchProfile = (token: string) => apiFetch<BizProfile>("/api/biz/profile", { token });

/** Saves business details, hours and branches. */
export const saveProfile = (token: string, profile: ProfileInput) =>
  apiFetch<BizProfile | { error: string; errors: Record<string, string> }>("/api/biz/profile", { token, body: profile });

/** Sets a new staff terminal PIN (signs out every terminal device). */
export const changePin = (token: string, pin: string) => apiFetch<{ ok: true }>("/api/biz/pin", { token, body: { pin } });

/** My redemptions log with totals (filters: from, to, cashier). */
export const fetchBizRedemptions = (token: string, query: string) =>
  apiFetch<{ rows: BizRedemption[]; totals: BizTotals }>(`/api/biz/redemptions?${query}`, { token });

/** Voids a redemption with a reason (owner only). */
export const voidBizRedemption = (token: string, id: string, reason: string) => apiFetch<{ ok: true }>("/api/biz/redemptions", { token, body: { id, reason } });

/** Downloads my redemptions log as CSV; returns an error message or null. */
export async function downloadBizCsv(token: string, query: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/biz/redemptions?${query}&format=csv`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return "ההורדה נכשלה";
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: "lobby-redemptions.csv" }).click();
    URL.revokeObjectURL(url);
    return null;
  } catch {
    return "אין חיבור לאינטרנט";
  }
}

/** My cashiers (scan-only logins). */
export const fetchCashiers = (token: string) => apiFetch<Cashier[]>("/api/biz/cashiers", { token });

/** Adds a cashier by email; returns the updated list. */
export const addCashier = (token: string, email: string) => apiFetch<Cashier[]>("/api/biz/cashiers", { token, body: { action: "add", email } });

/** Revokes a cashier; returns the updated list. */
export const revokeCashier = (token: string, userId: string) => apiFetch<Cashier[]>("/api/biz/cashiers", { token, body: { action: "revoke", userId } });

/** Uploads the business's one photo (its logo / profile picture); returns { logoUrl } or an error message. */
export async function uploadLogo(token: string, image: Blob): Promise<{ logoUrl: string } | { error: string }> {
  try {
    const form = new FormData();
    form.append("file", image, "logo.jpg");
    const res = await fetch("/api/biz/logo", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    const json = await res.json().catch(() => ({}));
    return res.ok ? json : { error: json.error ?? "ההעלאה נכשלה. נסו שוב." };
  } catch {
    return { error: "אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב." };
  }
}
