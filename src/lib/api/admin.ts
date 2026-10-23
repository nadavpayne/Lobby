import type { AdminBusiness, StatusChange } from "@/lib/admin/types";
import { apiFetch } from "./http";

/** All businesses for the admin page. */
export const fetchAdminBusinesses = (token: string) => apiFetch<AdminBusiness[]>("/api/admin/businesses", { token });

/** Activates or pauses a business. */
export const changeBusinessStatus = (token: string, id: string, status: StatusChange) =>
  apiFetch<AdminBusiness>(`/api/admin/businesses/${id}/status`, { token, body: { status } });
