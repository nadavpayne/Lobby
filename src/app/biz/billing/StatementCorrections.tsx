import type { BillingMonth } from "@/lib/biz/types";
import { formatAgorot } from "@/lib/qr/money";

const monthName = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });
const day = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", year: "2-digit" });
const money = (a: number) => <bdi dir="ltr">{formatAgorot(a)}</bdi>;

/** The statement's corrections: every redemption whose amount Lobby corrected after a resident's report, by the month it was charged in. */
export function StatementCorrections({ months }: { months: BillingMonth[] }) {
  const withCorrections = months.filter((m) => m.corrections.length > 0);
  if (withCorrections.length === 0) return null;
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-soft">
      <h2 className="text-lg font-bold">תיקוני סכומים</h2>
      <p className="text-sm text-navy/70">מימושים שהסכום שלהם תוקן אחרי בדיקה של לובי, בעקבות דיווח של דייר. תיקון בחודש שכבר חויב נכנס לחיוב של החודש שבו תוקן.</p>
      {withCorrections.map((m) => (
        <div key={m.period} className="flex flex-col gap-1">
          <h3 className="font-medium">{monthName.format(new Date(`${m.period}-01T00:00:00Z`))}</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {m.corrections.map((c) => (
              <li key={c.correctedAt + c.apartment} className="rounded-xl bg-cream p-2">
                מימוש מ-<bdi dir="ltr">{day.format(new Date(c.redeemedAt))}</bdi>, דירה {c.apartment}: חשבון {money(c.oldBillAgorot)} ← {money(c.newBillAgorot)},
                עמלה {money(c.oldCommissionAgorot)} ← {money(c.newCommissionAgorot)} <span className="text-muted">(תוקן ב-<bdi dir="ltr">{day.format(new Date(c.correctedAt))}</bdi>)</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
