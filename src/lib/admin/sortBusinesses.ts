import type { BusinessStatus } from "../businesses/types.ts";
import type { AdminBusiness } from "./types.ts";

const REVIEW_ORDER: Record<BusinessStatus, number> = { pending: 0, lead: 1, active: 2, paused: 3, declined: 4 };

/** Pending first (they need action), then leads, active, paused, declined; newest first within each group. */
export function sortForReview(list: AdminBusiness[]): AdminBusiness[] {
  return [...list].sort((a, b) => REVIEW_ORDER[a.status] - REVIEW_ORDER[b.status] || b.createdAt.localeCompare(a.createdAt));
}

/** Number of businesses in each status. */
export function countByStatus(list: AdminBusiness[]): Record<BusinessStatus, number> {
  const counts: Record<BusinessStatus, number> = { lead: 0, pending: 0, active: 0, paused: 0, declined: 0 };
  for (const b of list) counts[b.status]++;
  return counts;
}
