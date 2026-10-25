"use client";

import { Coins, HandCoins, Receipt, Repeat, ScanLine, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart, buttonClass, Card, Skeleton, StatTile } from "@/components/ui";
import { fetchDashboard } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BizDashboard } from "@/lib/biz/types";
import { formatShekels } from "@/lib/redemptions/money";
import { useBiz } from "./BizShell";

const dayMonth = (iso: string) => `${Number(iso.slice(8, 10))}.${Number(iso.slice(5, 7))}`;
const money = (n: number) => <bdi dir="ltr">{formatShekels(n)}</bdi>;

/** /biz — redemptions today/week/month, revenue through Lobby, commission owed, customers, last 30 days, top buildings. */
export default function BizDashboardScreen() {
  const { token } = useBiz();
  const [data, setData] = useState<BizDashboard>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchDashboard(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setData(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" role="status" aria-label="טוען">
        {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)}
      </div>
    );
  }
  const maxBuilding = Math.max(1, ...data.topBuildings.map((b) => b.redemptions));

  return (
    <div className="flex animate-pop-in flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">לוח בקרה</h1>
        <Link href="/biz/scan" className={buttonClass("primary", "md")}><ScanLine aria-hidden className="size-5" /> מימוש הטבה</Link>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="מימושים">
        <StatTile tint="peach" icon={<Receipt />} label="מימושים היום" value={data.today.redemptions} hint={money(data.today.gmv)} />
        <StatTile tint="sky" icon={<Receipt />} label="השבוע" value={data.week.redemptions} hint={money(data.week.gmv)} />
        <StatTile tint="lilac" icon={<Receipt />} label="החודש" value={data.month.redemptions} hint={money(data.month.gmv)} />
        <StatTile tint="navy" icon={<HandCoins />} label="עמלה לתשלום" value={money(data.commissionOwed)} hint="כולל החודש הנוכחי" />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="לקוחות והכנסות">
        <StatTile tint="mint" icon={<Coins />} label="הכנסות דרך לובי החודש" value={money(data.month.gmv)} />
        <StatTile icon={<UserPlus />} label="לקוחות חדשים החודש" value={data.newCustomers} />
        <StatTile icon={<Repeat />} label="לקוחות חוזרים החודש" value={data.returningCustomers} />
        <StatTile icon={<HandCoins />} label="עמלת לובי החודש" value={money(data.month.commission)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-lg font-bold">מימושים ב-30 הימים האחרונים</h2>
          <BarChart
            title="מימושים ליום ב-30 הימים האחרונים, היום מודגש בכתום"
            highlightLast
            bars={data.daily.map((d, i) => ({
              label: d.date,
              value: d.redemptions,
              tooltip: `${dayMonth(d.date)} · ${d.redemptions} מימושים`,
              tick: i % 7 === 2 || i === data.daily.length - 1 ? (i === data.daily.length - 1 ? "היום" : dayMonth(d.date)) : undefined,
            }))}
          />
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">הבניינים שמביאים לקוחות</h2>
          <p className="-mt-2 text-sm text-navy/60">90 הימים האחרונים</p>
          {data.topBuildings.length === 0 && <p className="text-navy/70">עוד אין מימושים.</p>}
          <ul className="flex flex-col gap-3">
            {data.topBuildings.map((b) => (
              <li key={b.name} className="flex flex-col gap-1">
                <div className="flex justify-between gap-2 text-sm"><span className="font-medium">{b.name}</span><span className="tabular-nums">{b.redemptions}</span></div>
                <div className="h-2 rounded-full bg-navy/10"><div className="h-2 rounded-full bg-amber" style={{ width: `${(b.redemptions / maxBuilding) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
