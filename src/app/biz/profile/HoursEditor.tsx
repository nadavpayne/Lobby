"use client";

import type { DayKey, WeekHours } from "@/lib/offers/hours";

const DAYS: [DayKey, string][] = [
  ["sun", "ראשון"], ["mon", "שני"], ["tue", "שלישי"], ["wed", "רביעי"], ["thu", "חמישי"], ["fri", "שישי"], ["sat", "שבת"],
];
const timeInput = "min-h-11 rounded-xl border border-navy/25 bg-white px-2 tabular-nums";

/**
 * Weekly opening hours: per day open/closed and one from–to range.
 * shortcut: one range per day in the editor (the data allows two, e.g. a lunch break); add a second row when asked.
 */
export function HoursEditor({ hours, onChange }: { hours: WeekHours; onChange: (h: WeekHours) => void }) {
  /** Sets one day's range (or closes it with null). */
  const setDay = (day: DayKey, range: [string, string] | null) => onChange({ ...hours, [day]: range ? [range] : [] });

  return (
    <div className="flex flex-col gap-2">
      {DAYS.map(([day, label]) => {
        const range = hours[day]?.[0];
        return (
          <div key={day} className="flex flex-wrap items-center gap-3">
            <span className="w-14 font-medium">{label}</span>
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="checkbox" checked={!!range} onChange={(e) => setDay(day, e.target.checked ? ["08:00", "20:00"] : null)} className="size-5 accent-navy" />
              פתוח
            </label>
            {range ? (
              <span dir="ltr" className="inline-flex items-center gap-2">
                <input type="time" aria-label={`${label} פתיחה`} value={range[0]} onChange={(e) => setDay(day, [e.target.value, range[1]])} className={timeInput} />
                <span className="text-muted">עד</span>
                <input type="time" aria-label={`${label} סגירה`} value={range[1]} onChange={(e) => setDay(day, [range[0], e.target.value])} className={timeInput} />
              </span>
            ) : (
              <span className="text-muted">סגור</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
