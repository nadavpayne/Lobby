"use client";

import { HandCoins, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { DataTable, EmptyState, Skeleton, StatTile, Tag, type Column } from "@/components/ui";
import { fetchBilling } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BillingMonth } from "@/lib/biz/types";
import { formatAgorot } from "@/lib/qr/money";
import { formatShekels } from "@/lib/redemptions/money";
import { useBiz } from "../BizShell";
import { StatementCorrections } from "./StatementCorrections";

const monthName = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });
const paidOn = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });
const money = (n: number) => <bdi dir="ltr">{formatShekels(n)}</bdi>;

const STATUS: Record<BillingMonth["status"], [string, "sky" | "rose" | "mint"]> = {
  current: ["החודש, עוד רץ", "sky"],
  open: ["לתשלום", "rose"],
  paid: ["שולם", "mint"],
};

const COLUMNS: Column<BillingMonth>[] = [
  { key: "month", header: "חודש", render: (m) => <span className="font-medium">{monthName.format(new Date(`${m.period}-01T00:00:00Z`))}</span> },
  { key: "redemptions", header: "מימושים", align: "end", render: (m) => m.redemptions },
  { key: "gmv", header: "הכנסות דרך לובי", align: "end", render: (m) => money(m.gmv) },
  {
    key: "commission", header: "עמלה", align: "end",
    render: (m) => (
      <span className="font-bold">
        {money(m.commission)}
        {m.adjustmentsAgorot !== 0 && <span className="block text-sm font-normal text-muted">כולל תיקונים <bdi dir="ltr">{formatAgorot(m.adjustmentsAgorot)}</bdi></span>}
      </span>
    ),
  },
  {
    key: "status", header: "סטטוס",
    render: (m) => <span className="inline-flex items-center gap-2"><Tag tint={STATUS[m.status][1]}>{STATUS[m.status][0]}</Tag>{m.paidAt && <span className="text-sm text-muted">{paidOn.format(new Date(m.paidAt))}</span>}</span>,
  },
];

/** /biz/billing — commission per month (the monthly statement) and what's paid or owed. */
export default function BillingScreen() {
  const { token } = useBiz();
  const [months, setMonths] = useState<BillingMonth[]>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchBilling(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setMonths(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  const owed = months?.filter((m) => m.status === "open").reduce((s, m) => s + m.commission, 0) ?? 0;
  const current = months?.find((m) => m.status === "current");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">חיובים</h1>
      {!months && <Skeleton className="h-64 w-full rounded-3xl" />}
      {months && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile tint={owed > 0 ? "rose" : "mint"} icon={<HandCoins />} label="לתשלום עכשיו" value={money(owed)} hint={owed > 0 ? "חודשים שהסתיימו" : "הכל שולם"} />
            <StatTile tint="sky" icon={<ReceiptText />} label="עמלה החודש עד כה" value={money(current?.commission ?? 0)} hint={`${current?.redemptions ?? 0} מימושים`} />
          </div>
          <p className="text-sm text-navy/70">העמלה מחושבת מסכום החשבון המלא לפני ההנחה, רק על מימושים שאישרתם בקופה. חשבונית נשלחת בתחילת כל חודש.</p>
          <DataTable
            columns={COLUMNS}
            rows={months}
            rowKey={(m) => m.period}
            empty={<EmptyState icon={<ReceiptText />} title="עוד אין חיובים">החיוב הראשון יופיע אחרי המימוש הראשון.</EmptyState>}
          />
          <StatementCorrections months={months} />
        </>
      )}
    </div>
  );
}
