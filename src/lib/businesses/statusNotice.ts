import type { BusinessStatus } from "./types";

/** Why a non-active business can't verify codes yet (shown on the terminal and returned by the API). */
export const STATUS_NOTICE: Record<Exclude<BusinessStatus, "active">, string> = {
  lead: "העסק עוד לא הצטרף ללובי. לפרטים צרו קשר עם לובי.",
  pending: "העסק ממתין לאישור",
  paused: "העסק מושהה כרגע. לפרטים צרו קשר עם לובי.",
  declined: "הבקשה של העסק להצטרף ללובי לא אושרה. לפרטים צרו קשר עם לובי.",
};
