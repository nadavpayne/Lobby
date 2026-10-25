/** Opening hours as stored in businesses.hours / branches.hours: {"sun": [["08:00","21:00"]], ..., "sat": []}. */
export type WeekHours = Partial<Record<DayKey, [string, string][]>>;

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

const DAYS: [DayKey, string][] = [
  ["sun", "ראשון"], ["mon", "שני"], ["tue", "שלישי"], ["wed", "רביעי"], ["thu", "חמישי"], ["fri", "שישי"], ["sat", "שבת"],
];

const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", weekday: "short" });

/** Today's day key in Israel time. */
export function todayKey(now = new Date()): DayKey {
  return weekday.format(now).toLowerCase() as DayKey;
}

/** "08:00–21:00", two ranges joined with a comma, or "סגור". */
function rangesText(ranges: [string, string][] | undefined): string {
  return ranges?.length ? ranges.map(([from, to]) => `${from}–${to}`).join(", ") : "סגור";
}

/** One row per weekday, Sunday first, with today's row marked. */
export function weekRows(hours: WeekHours, now = new Date()): { day: string; text: string; today: boolean }[] {
  const today = todayKey(now);
  return DAYS.map(([key, day]) => ({ day, text: rangesText(hours[key]), today: key === today }));
}

/** "פתוח היום 08:00–21:00" or "סגור היום". */
export function todayLine(hours: WeekHours, now = new Date()): string {
  const ranges = hours[todayKey(now)];
  return ranges?.length ? `פתוח היום ${rangesText(ranges)}` : "סגור היום";
}
