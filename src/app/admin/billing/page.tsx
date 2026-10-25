"use client";

import { HandCoins, ReceiptText, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Button, Chip, ChipRow, DataTable, EmptyState, Skeleton, StatTile, Tag, type Column } from "@/components/ui";
import { fetchAdminBilling, setMonthPaid } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { BillingLine } from "@/lib/admin/billing";
import { formatShekels } from "@/lib/redemptions/money";

const monthName = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" });
const month = (p: string) => monthName.format(new Date(`${p}-01T00:00:00Z`));
const money = (n: number) => <bdi dir="ltr">{formatShekels(n)}</bdi>;
const STATUS: Record<BillingLine["status"], [string, "sky" | "rose" | "mint"]> = { current: ["חודש נוכחי", "sky"], open: ["לגבייה", "rose"], paid: ["שולם", "mint"] };

/** Commission per business per month: who owes what, mark as paid, top businesses. */
export default function AdminBillingScreen() {
  const { token } = useAccount();
  const [lines, setLines] = useState<BillingLine[]>();
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchAdminBilling(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setLines(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  /** Marks one business-month paid or back to open. */
  async function togglePaid(l: BillingLine) {
    setBusy(`${l.businessId}|${l.period}`);
    const res = await setMonthPaid(token, l.businessId, l.period, l.status !== "paid");
    setBusy(null);
    if (isApiError(res)) return setError(res.error);
    setLines(res);
  }

  const periods = [...new Set(lines?.map((l) => l.period))];
  const visible = lines?.filter((l) => !period || l.period === period);
  const owed = lines?.filter((l) => l.status === "open").reduce((s, l) => s + l.commission, 0) ?? 0;
  const top = Object.values(
    (lines ?? []).reduce<Record<string, { name: string; gmv: number }>>((acc, l) => {
      acc[l.businessId] = { name: l.business, gmv: (acc[l.businessId]?.gmv ?? 0) + l.gmv };
      return acc;
    }, {}),
  ).sort((a, b) => b.gmv - a.gmv)[0];

  const columns: Column<BillingLine>[] = [
    { key: "business", header: "עסק", render: (l) => <span className="font-medium">{l.business}</span> },
    { key: "period", header: "חודש", render: (l) => month(l.period) },
    { key: "count", header: "מימושים", align: "end", render: (l) => l.redemptions },
    { key: "gmv", header: "מחזור", align: "end", render: (l) => money(l.gmv) },
    { key: "commission", header: "עמלה", align: "end", render: (l) => <span className="font-bold">{money(l.commission)}</span> },
    { key: "status", header: "סטטוס", render: (l) => <Tag tint={STATUS[l.status][1]}>{STATUS[l.status][0]}</Tag> },
    {
      key: "action", header: "", render: (l) => l.status === "current" ? null : (
        <Button size="sm" variant={l.status === "paid" ? "ghost" : "primary"} onClick={() => togglePaid(l)} disabled={busy === `${l.businessId}|${l.period}`}>
          {l.status === "paid" ? "ביטול" : "סימון כשולם"}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">חיובים</h1>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!lines && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {lines && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile tint={owed > 0 ? "rose" : "mint"} icon={<HandCoins />} label="פתוח לגבייה" value={money(owed)} hint="חודשים שהסתיימו" />
            <StatTile tint="sky" icon={<ReceiptText />} label="עמלה החודש עד כה" value={money(lines.filter((l) => l.status === "current").reduce((s, l) => s + l.commission, 0))} />
            {top && <StatTile tint="peach" icon={<Trophy />} label="העסק המוביל במחזור" value={top.name} hint={formatShekels(top.gmv)} />}
          </div>
          <ChipRow label="סינון לפי חודש">
            <Chip selected={!period} onClick={() => setPeriod(null)}>כל החודשים</Chip>
            {periods.map((p) => <Chip key={p} selected={period === p} onClick={() => setPeriod(p)}>{month(p)}</Chip>)}
          </ChipRow>
          <DataTable columns={columns} rows={visible!} rowKey={(l) => `${l.businessId}|${l.period}`} empty={<EmptyState icon={<ReceiptText />} title="אין חיובים" />} />
        </>
      )}
    </div>
  );
}
