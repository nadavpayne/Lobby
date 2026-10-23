import type { BusinessStatus } from "./types";

/** Why a non-active business can't verify codes yet (shown on the terminal and returned by the API). */
export const STATUS_NOTICE: Record<Exclude<BusinessStatus, "active">, string> = {
  pending: "העסק ממתין לאישור של לובי. אפשר יהיה לאמת קודים מיד אחרי ההפעלה.",
  paused: "העסק מושהה כרגע. לפרטים צרו קשר עם לובי.",
};
