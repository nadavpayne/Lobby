"use client";

import { Coins, Download, HandCoins, Home, PiggyBank, Receipt, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, DataTable, EmptyState, Skeleton, StatTile, Tag, type Column } from "@/components/ui";
import { downloadBizCsv, fetchBizRedemptions, fetchCashiers } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { Cashier } from "@/lib/biz/cashiers";
import type { BizRedemption, BizTotals } from "@/lib/biz/redemptionsLog";
import { formatAgorot } from "@/lib/qr/money";
import { useBiz } from "../BizShell";
import { VoidDialog } from "./VoidDialog";

const time = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const israelDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });
const money = (agorot: number) => <bdi dir="ltr">{formatAgorot(agorot)}</bdi>;
const field = "min-h-11 rounded-xl border border-navy/25 bg-white px-3";

/** The first day of this month and today, as Israel calendar days (the default filter = this month). */
function thisMonth(): { from: string; to: string } {
  const today = israelDay.format(new Date());
  return { from: `${today.slice(0, 8)}01`, to: today };
}

/** /biz/redemptions — every redemption with date and cashier filters, totals, CSV, and voids (owner only). */
export default function BizRedemptionsScreen() {
  const { token } = useBiz();
  const [filters, setFilters] = useState({ ...thisMonth(), cashier: "" });
  const [data, setData] = useState<{ rows: BizRedemption[]; totals: BizTotals }>();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<BizRedemption | null>(null);
  const [version, setVersion] = useState(0);
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  useEffect(() => {
    fetchCashiers(token).then((res) => !isApiError(res) && setCashiers(res));
  }, [token]);

  useEffect(() => {
    let live = true;
    fetchBizRedemptions(token, query).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setData(res);
    });
    return () => {
      live = false;
    };
  }, [token, query, version]);

  const set = (k: keyof typeof filters) => (e: { target: { value: string } }) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const columns: Column<BizRedemption>[] = [
    { key: "time", header: "זמן", render: (r) => time.format(new Date(r.redeemedAt)) },
    { key: "apt", header: "דירה", render: (r) => <span>{r.building}<span className="block text-sm text-muted">דירה {r.apartment} · {r.customer}</span></span> },
    { key: "cashier", header: "קופה", render: (r) => <span className="text-sm">{r.cashier}</span> },
    {
      key: "bill", header: "חשבון", align: "end",
      render: (r) => (
        <span>
          {money(r.billAgorot)}
          {r.correctedFromAgorot !== null && <span className="mt-1 flex items-center justify-end gap-1 text-sm text-muted"><Tag tint="mint">תוקן</Tag> נרשם {money(r.correctedFromAgorot)}</span>}
        </span>
      ),
    },
    { key: "discount", header: "הנחה", align: "end", render: (r) => money(r.discountAgorot) },
    { key: "commission", header: "עמלה", align: "end", render: (r) => money(r.commissionAgorot) },
    {
      key: "status", header: "", render: (r) => r.status === "voided"
        ? <span title={r.voidReason ?? undefined}><Tag tint="white">בוטל</Tag></span>
        : <Button size="sm" variant="ghost" onClick={() => setVoiding(r)}><Undo2 aria-hidden className="size-4" /> ביטול</Button>,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">מימושים</h1>
        <Button size="md" variant="navy" onClick={async () => setError(await downloadBizCsv(token, query))}><Download aria-hidden className="size-4" /> ייצוא CSV</Button>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-3xl bg-white p-3 shadow-soft">
        <label className="flex flex-col text-sm">מתאריך<input type="date" value={filters.from} onChange={set("from")} className={field} /></label>
        <label className="flex flex-col text-sm">עד<input type="date" value={filters.to} onChange={set("to")} className={field} /></label>
        <label className="flex flex-col text-sm">
          קופה
          <select value={filters.cashier} onChange={set("cashier")} className={field}>
            <option value="">כולם</option>
            <option value="terminal">מסוף הקופה (PIN)</option>
            {cashiers.map((c) => <option key={c.userId} value={c.userId}>{c.email}</option>)}
          </select>
        </label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!data && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {data && (
        <>
          <section aria-label="סיכום" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatTile tint="peach" icon={<Receipt />} label="מימושים" value={data.totals.redemptions} />
            <StatTile tint="sky" icon={<Home />} label="דירות שונות" value={data.totals.apartments} />
            <StatTile tint="mint" icon={<Coins />} label="מחזור דרך לובי" value={money(data.totals.billAgorot)} />
            <StatTile tint="lilac" icon={<PiggyBank />} label="הנחות שניתנו" value={money(data.totals.discountAgorot)} />
            <StatTile tint="navy" icon={<HandCoins />} label="עמלה ללובי" value={money(data.totals.commissionAgorot)} />
          </section>
          <p className="text-sm text-muted">הסיכומים לא כוללים מימושים שבוטלו.</p>
          <DataTable columns={columns} rows={data.rows} rowKey={(r) => r.id} empty={<EmptyState icon={<Receipt />} title="אין מימושים בתקופה הזו" />} />
        </>
      )}
      <VoidDialog token={token} redemption={voiding} onClose={() => setVoiding(null)} onVoided={() => { setVoiding(null); setVersion((v) => v + 1); }} />
    </div>
  );
}
