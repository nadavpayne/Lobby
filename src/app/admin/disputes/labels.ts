import type { Tint } from "@/components/ui";
import type { DisputeReason, DisputeStatus } from "@/lib/disputes/types";

export const REASON_LABEL: Record<DisputeReason, string> = {
  BILL_HIGHER: "החשבון היה גבוה יותר",
  DISCOUNT_NOT_GIVEN: "לא קיבל/ה את ההנחה",
  OTHER: "אחר",
};

export const STATUS_LABEL: Record<DisputeStatus, [string, Tint]> = {
  OPEN: ["פתוח", "peach"],
  IN_REVIEW: ["בבדיקה", "sky"],
  CORRECTED: ["תוקן", "mint"],
  DISMISSED: ["נדחה", "white"],
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long a report has been waiting: "היום", "אתמול", "לפני 3 ימים". */
export function ageLabel(createdAt: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(createdAt).getTime()) / DAY_MS);
  return days <= 0 ? "היום" : days === 1 ? "אתמול" : `לפני ${days} ימים`;
}
