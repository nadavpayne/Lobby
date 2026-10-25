import { weekRows, type WeekHours } from "@/lib/offers/hours";

/** The week's opening hours, today in bold. */
export function HoursList({ hours }: { hours: WeekHours }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
      {weekRows(hours).map((r) => (
        <div key={r.day} className={`contents ${r.today ? "font-bold" : ""}`}>
          <dt className={r.today ? "" : "text-navy/70"}>{r.day}{r.today && " (היום)"}</dt>
          <dd dir="ltr" className="text-end">{r.text}</dd>
        </div>
      ))}
    </dl>
  );
}
