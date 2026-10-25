const monthFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit" });

/** Calendar month in Israel time, e.g. "2026-10" — same as the DB's public.current_period(). */
export const currentPeriod = (date = new Date()) => monthFormat.format(date);
