const monthFormat = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit" });

/** Calendar month in Israel time, e.g. "2026-10" — same as the DB's public.current_period(). */
export const currentPeriod = (date = new Date()) => monthFormat.format(date);

/** The first day of the next calendar month (Israel time) as "YYYY-MM-01": when monthly benefits renew. */
export function nextPeriodStart(date = new Date()): string {
  const [y, m] = currentPeriod(date).split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}
