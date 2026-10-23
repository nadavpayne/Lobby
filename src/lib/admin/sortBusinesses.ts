import type { BusinessStatus } from "../businesses/types.ts";
import type { AdminBusiness } from "./types.ts";

const REVIEW_ORDER: Record<BusinessStatus, number> = { pending: 0, active: 1, paused: 2 };

/** Pending first (they need action), then active, then paused; newest first within each group. */
export function sortForReview(list: AdminBusiness[]): AdminBusiness[] {
  return [...list].sort((a, b) => REVIEW_ORDER[a.status] - REVIEW_ORDER[b.status] || b.createdAt.localeCompare(a.createdAt));
}

/** Number of businesses in each status. */
export function countByStatus(list: AdminBusiness[]): Record<BusinessStatus, number> {
  const counts: Record<BusinessStatus, number> = { pending: 0, active: 0, paused: 0 };
  for (const b of list) counts[b.status]++;
  return counts;
}
