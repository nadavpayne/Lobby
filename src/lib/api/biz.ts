import type { BusinessStatus } from "@/lib/businesses/types";
import type { BillingMonth, BizDashboard, BizOffer, BizProfile, Customer, OfferInput, ProfileInput } from "@/lib/biz/types";
import { apiFetch } from "./http";

// Client calls for the business owner CRM (/biz). Every route checks the owner role on the server.

export interface MyBusiness {
  name: string;
  status: BusinessStatus;
}

/** My business's name and status. */
export const fetchMyBusiness = (token: string) => apiFetch<MyBusiness>("/api/biz/me", { token });

/** Dashboard numbers, daily series and top buildings. */
export const fetchDashboard = (token: string) => apiFetch<BizDashboard>("/api/biz/dashboard", { token });

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
