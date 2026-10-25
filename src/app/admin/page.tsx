"use client";

import { BadgeCheck, Building2, Coins, HandCoins, PiggyBank, Receipt, Store, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { BarChart, Card, Skeleton, StatTile } from "@/components/ui";
import { fetchOverview } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminOverview } from "@/lib/admin/overview";
import { formatShekels } from "@/lib/redemptions/money";

const money = (n: number) => <bdi dir="ltr">{formatShekels(n)}</bdi>;
const monthLabel = new Intl.DateTimeFormat("he-IL", { month: "short", timeZone: "UTC" });
const label = (period: string) => monthLabel.format(new Date(`${period}-01T00:00:00Z`));

/** /admin — the whole club at a glance: buildings, residents, businesses, money, growth. */
export default function AdminOverviewScreen() {
  const { token } = useAccount();
  const [o, setO] = useState<AdminOverview>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchOverview(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setO(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!o) return <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}</div>;

  return (
    <div className="flex animate-pop-in flex-col gap-5">
      <h1 className="text-3xl font-bold">סקירה</h1>
      {o.pendingOffers > 0 && (
        <Link href="/admin/businesses?filter=review" className="flex items-center gap-3 rounded-2xl bg-peach p-4 font-medium shadow-soft">
          <BadgeCheck aria-hidden className="size-5" /> {o.pendingOffers === 1 ? "עסק אחד מחכה לאישור שלך" : `${o.pendingOffers} עסקים מחכים לאישור שלך`}
        </Link>
      )}
      <section aria-label="היקף" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile tint="sky" icon={<Building2 />} label="בניינים פעילים" value={o.activeBuildings} />
        <StatTile tint="lilac" icon={<Users />} label="דיירים" value={o.residents} />
        <StatTile tint="mint" icon={<Store />} label="עסקים פעילים" value={o.activeBusinesses} />
        <StatTile tint="peach" icon={<Receipt />} label="מימושים החודש" value={o.month.redemptions} />
      </section>
      <section aria-label="כסף" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={<Coins />} label="מחזור דרך לובי החודש" value={money(o.month.gmv)} />
        <StatTile tint="navy" icon={<HandCoins />} label="עמלה החודש" value={money(o.month.commission)} />
        <StatTile icon={<HandCoins />} label="עמלה מצטברת" value={money(o.allTime.commission)} hint={`${o.allTime.redemptions} מימושים · מחזור ${formatShekels(o.allTime.gmv)}`} />
        <StatTile tint="mint" icon={<PiggyBank />} label="הדיירים חסכו" value={money(o.allTime.saved)} />
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">מימושים לפי חודש</h2>
          <BarChart
            title="מימושים בכל אחד מששת החודשים האחרונים, החודש הנוכחי בכתום"
            highlightLast
            showValues
            bars={o.monthly.map((m) => ({ label: m.period, value: m.redemptions, tooltip: `${label(m.period)} · ${m.redemptions} מימושים · עמלה ${formatShekels(m.commission)}`, tick: label(m.period) }))}
          />
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">דיירים חדשים לפי חודש</h2>
          <BarChart
            title="דיירים שהצטרפו בכל אחד מששת החודשים האחרונים, החודש הנוכחי בכתום"
            highlightLast
            showValues
            bars={o.monthly.map((m) => ({ label: m.period, value: m.newResidents, tooltip: `${label(m.period)} · ${m.newResidents} דיירים חדשים`, tick: label(m.period) }))}
          />
        </Card>
      </div>
    </div>
  );
}
