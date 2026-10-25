// Hebrew date bits shared by the QR screens.

const month = new Intl.DateTimeFormat("he-IL", { month: "long", timeZone: "UTC" });
const dateTime = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const time = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" });

/** "2026-10" → "אוקטובר". */
export const monthOfPeriod = (period: string) => month.format(new Date(`${period}-01T12:00:00Z`));

/** "2026-11-01" → "1 בנובמבר" (when the next benefit unlocks). */
export const unlockDay = (day: string) => `${Number(day.slice(8, 10))} ב${month.format(new Date(`${day}T12:00:00Z`))}`;

/** "25.10.2026 · 12:41" in Israel time. */
export const receiptTime = (iso: string) => dateTime.format(new Date(iso)).replace(",", " ·");

/** "12:41" in Israel time. */
export const clock = (iso: string) => time.format(new Date(iso));
