import type { BillingLine } from "@/lib/admin/billing";
import type { AdminBuilding, CommitteeReport } from "@/lib/admin/buildings";
import type { ContentData } from "@/lib/admin/content";
import type { OfferAction } from "@/lib/admin/offers";
import type { AdminOverview } from "@/lib/admin/overview";
import type { LogRow } from "@/lib/admin/redemptions";
import type { AdminResident } from "@/lib/admin/residents";
import type { SearchHit } from "@/lib/admin/search";
import type { AdminBusiness } from "@/lib/admin/types";
import type { BannerInput, BuildingLead, BusinessLead, NotificationInput } from "@/lib/admin/validate";
import type { BusinessStatus } from "@/lib/businesses/types";
import { apiFetch, type ApiError } from "./http";

// Client calls for the Lobby operator CRM (/admin). Every route checks the admin role on the server.

/** A failed save that may carry per-field errors. */
export type FormError = ApiError & { errors?: Record<string, string> };

export const fetchOverview = (token: string) => apiFetch<AdminOverview>("/api/admin/overview", { token });

export const searchAll = (token: string, q: string) => apiFetch<SearchHit[]>(`/api/admin/search?q=${encodeURIComponent(q)}`, { token });

export const fetchBuildings = (token: string) => apiFetch<AdminBuilding[]>("/api/admin/buildings", { token });

/** Adds or edits a building in the committee pipeline; returns the updated list. */
export const saveBuilding = (token: string, b: BuildingLead & { id?: string }) =>
  apiFetch<AdminBuilding[]>("/api/admin/buildings", { token, body: { action: "save", ...b } }) as Promise<AdminBuilding[] | FormError>;

/** Issues a new invite link (the old one stops working); returns the updated list. */
export const newInvite = (token: string, id: string) => apiFetch<AdminBuilding[]>("/api/admin/buildings", { token, body: { action: "invite", id } });

/** Deletes a building (refused if it has redemptions); returns the updated list. */
export const deleteBuilding = (token: string, id: string) => apiFetch<AdminBuilding[]>("/api/admin/buildings", { token, body: { action: "delete", id } });

export const fetchReport =(token: string, id: string, period: string) =>
  apiFetch<CommitteeReport>(`/api/admin/buildings/${id}/report?period=${period}`, { token });

export const fetchAdminBusinesses = (token: string) => apiFetch<AdminBusiness[]>("/api/admin/businesses", { token });

export const addBusinessLead = (token: string, lead: BusinessLead) =>
  apiFetch<AdminBusiness>("/api/admin/businesses", { token, body: { action: "lead", ...lead } }) as Promise<AdminBusiness | FormError>;

export const setBusinessStage = (token: string, id: string, status: BusinessStatus) =>
  apiFetch<AdminBusiness>("/api/admin/businesses", { token, body: { action: "status", id, status } });

export const setBusinessCommission = (token: string, id: string, commissionPercent: number) =>
  apiFetch<AdminBusiness>("/api/admin/businesses", { token, body: { action: "commission", id, commissionPercent } });

/** Approve / un-approve / override discount / feature / pause an offer; returns its business. */
export const offerAction = (token: string, id: string, action: OfferAction) => apiFetch<AdminBusiness>(`/api/admin/offers/${id}`, { token, body: action });

export const fetchResidents = (token: string, q: string, building: string | null) =>
  apiFetch<AdminResident[]>(`/api/admin/residents?q=${encodeURIComponent(q)}${building ? `&building=${building}` : ""}`, { token });

export const setResidentBlocked = (token: string, id: string, blocked: boolean) =>
  apiFetch<{ ok: true }>("/api/admin/residents", { token, body: { id, status: blocked ? "blocked" : "active" } });

export const fetchLog = (token: string, query: string) => apiFetch<LogRow[]>(`/api/admin/redemptions?${query}`, { token });

/** Downloads the log as CSV (fetch with the token, then save via a temporary link). */
export async function downloadLogCsv(token: string, query: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/admin/redemptions?${query}&format=csv`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return "ההורדה נכשלה";
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: "lobby-redemptions.csv" });
    a.click();
    URL.revokeObjectURL(url);
    return null;
  } catch {
    return "אין חיבור לאינטרנט";
  }
}

export const fetchAdminBilling = (token: string) => apiFetch<BillingLine[]>("/api/admin/billing", { token });

export const setMonthPaid = (token: string, businessId: string, period: string, paid: boolean) =>
  apiFetch<BillingLine[]>("/api/admin/billing", { token, body: { businessId, period, paid } });

export const fetchContent = (token: string) => apiFetch<ContentData>("/api/admin/content", { token });

export const saveBanner = (token: string, b: BannerInput & { id?: string }) =>
  apiFetch<ContentData>("/api/admin/content", { token, body: { action: "banner", ...b } }) as Promise<ContentData | FormError>;

export const removeBanner = (token: string, id: string) => apiFetch<ContentData>("/api/admin/content", { token, body: { action: "deleteBanner", id } });

export const saveCategory = (token: string, slug: string, name: string, sort: number, active: boolean) =>
  apiFetch<ContentData>("/api/admin/content", { token, body: { action: "category", slug, name, sort, active } });

export const sendAnnouncement = (token: string, n: NotificationInput) =>
  apiFetch<ContentData>("/api/admin/content", { token, body: { action: "notify", ...n } }) as Promise<ContentData | FormError>;
