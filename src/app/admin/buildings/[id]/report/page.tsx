"use client";

import { Printer } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Button, Logo, Skeleton } from "@/components/ui";
import { fetchReport } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { CommitteeReport } from "@/lib/admin/buildings";
import { currentPeriod } from "@/lib/period";
import { formatShekels } from "@/lib/redemptions/money";

const monthName = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });

/** The last 6 months, newest first, for the month picker. */
function recentPeriods(): string[] {
  const [y, m] = currentPeriod().split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/**
 * Monthly committee report for one building, laid out for printing: the browser's "Save as PDF" makes the PDF.
 * shortcut: print-to-PDF instead of a generated file; add server-side PDF if committees need it emailed automatically.
 */
export default function CommitteeReportScreen() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAccount();
  const periods = recentPeriods();
  const [period, setPeriod] = useState(periods[0]); // current month by default, so this month's savings show up
  const [report, setReport] = useState<CommitteeReport>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchReport(token, id, period).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setReport(res);
    });
    return () => {
      live = false;
    };
  }, [token, id, period]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  const r = report?.period === period ? report : undefined;
  const title = (p: string) => monthName.format(new Date(`${p}-01T00:00:00Z`));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <label className="flex items-center gap-2">
          חודש
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="min-h-11 rounded-xl border border-navy/25 bg-white px-3">
            {periods.map((p) => <option key={p} value={p}>{title(p)}</option>)}
          </select>
        </label>
        <Button size="md" variant="navy" onClick={() => window.print()} disabled={!r}><Printer aria-hidden className="size-4" /> הדפסה / שמירה כ-PDF</Button>
      </div>

      {!r && <Skeleton className="h-96 w-full rounded-3xl" />}
      {r && (
        <article className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-soft print:max-w-none print:rounded-none print:p-0 print:shadow-none">
          <header className="flex items-center justify-between gap-4 border-b border-navy/10 pb-4">
            <div>
              <p className="text-navy/60">דוח חודשי לוועד הבית · {title(r.period)}</p>
              <h1 className="text-3xl font-bold">{r.building.name ?? r.building.address}</h1>
              <p>{r.building.address}, {r.building.city}</p>
            </div>
            <Logo className="size-14" label="Lobby" />
          </header>
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["דירות שהצטרפו", `${r.apartmentsJoined}/${r.building.apartmentCount}`],
              ["חשבונות פעילים", String(r.members)],
              ["הצטרפו בחודש זה", String(r.newMembers)],
              ["מימושים", String(r.redemptions)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-cream p-4">
                <p className="text-sm text-navy/70">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </section>
          <p className="rounded-2xl bg-mint p-4 text-lg">
            הדיירים בבניין חסכו ב{title(r.period)} <bdi dir="ltr" className="font-bold">{formatShekels(r.saved)}</bdi> בעסקים בשכונה.
          </p>
          <section>
            <h2 className="mb-2 text-lg font-bold">איפה השתמשו בהטבות</h2>
            {r.byBusiness.length === 0 ? <p className="text-navy/70">לא היו מימושים בחודש הזה.</p> : (
              <table className="w-full text-start">
                <thead><tr className="border-b border-navy/10 text-sm text-navy/60"><th className="py-2 text-start font-medium">עסק</th><th className="py-2 text-end font-medium">מימושים</th><th className="py-2 text-end font-medium">חיסכון</th></tr></thead>
                <tbody>{r.byBusiness.map((b) => <tr key={b.name} className="border-b border-navy/5"><td className="py-2">{b.name}</td><td className="py-2 text-end tabular-nums">{b.redemptions}</td><td className="py-2 text-end"><bdi dir="ltr">{formatShekels(b.saved)}</bdi></td></tr>)}</tbody>
              </table>
            )}
          </section>
          <footer className="text-sm text-navy/60">הופק על ידי לובי, מועדון ההטבות של הבניין{r.building.committeeName ? ` · לכבוד ${r.building.committeeName}` : ""}.</footer>
        </article>
      )}
    </div>
  );
}
