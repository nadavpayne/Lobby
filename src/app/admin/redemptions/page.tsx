"use client";

import { Download, Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Button, DataTable, EmptyState, Skeleton, Tag, type Column } from "@/components/ui";
import { downloadLogCsv, fetchAdminBusinesses, fetchBuildings, fetchLog } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { LogRow } from "@/lib/admin/redemptions";
import { formatShekels } from "@/lib/redemptions/money";

const time = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const STATUS: Record<LogRow["status"], [string, "mint" | "white"]> = { redeemed: ["מומש", "mint"], voided: ["בוטל", "white"] };
const money = (n: number | null) => (n === null ? "—" : <bdi dir="ltr">{formatShekels(n)}</bdi>);
const select = "min-h-11 rounded-xl border border-navy/25 bg-white px-3";

const COLUMNS: Column<LogRow>[] = [
  { key: "time", header: "זמן", render: (r) => time.format(new Date(r.redeemedAt ?? r.issuedAt)) },
  { key: "business", header: "עסק", render: (r) => <span className="font-medium">{r.business}</span> },
  { key: "building", header: "בניין", render: (r) => <span>{r.building}<span className="block text-sm text-navy/60">דירה {r.apartment}{r.resident ? ` · ${r.resident}` : ""}</span></span> },
  { key: "status", header: "סטטוס", render: (r) => <Tag tint={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag> },
  { key: "amount", header: "חשבון", align: "end", render: (r) => money(r.amount) },
  { key: "discount", header: "הנחה", align: "end", render: (r) => money(r.discount) },
  { key: "commission", header: "עמלה", align: "end", render: (r) => money(r.commission) },
];

/** Every redemption, filterable by dates, business, building and status, with CSV export. */
export default function RedemptionsScreen() {
  const { token } = useAccount();
  const [filters, setFilters] = useState({ from: "", to: "", business: "", building: "", status: "" });
  const [rows, setRows] = useState<LogRow[]>();
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<{ businesses: { id: string; name: string }[]; buildings: { id: string; name: string }[] }>({ businesses: [], buildings: [] });
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  useEffect(() => {
    Promise.all([fetchAdminBusinesses(token), fetchBuildings(token)]).then(([biz, bld]) => setOptions({
      businesses: isApiError(biz) ? [] : biz.filter((b) => !b.isDemo).map((b) => ({ id: b.id, name: b.name })),
      buildings: isApiError(bld) ? [] : bld.map((b) => ({ id: b.id, name: b.name ?? b.address })),
    }));
  }, [token]);

  useEffect(() => {
    let live = true;
    fetchLog(token, query).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setRows(res);
    });
    return () => {
      live = false;
    };
  }, [token, query]);

  const set = (k: keyof typeof filters) => (e: { target: { value: string } }) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const redeemed = rows?.filter((r) => r.status === "redeemed") ?? [];
  const sum = (k: "amount" | "discount" | "commission") => redeemed.reduce((s, r) => s + (r[k] ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">יומן מימושים</h1>
        <Button size="md" variant="navy" onClick={async () => setError(await downloadLogCsv(token, query))}><Download aria-hidden className="size-4" /> ייצוא CSV</Button>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-3xl bg-white p-3 shadow-soft">
        <label className="flex flex-col text-sm">מתאריך<input type="date" value={filters.from} onChange={set("from")} className={select} /></label>
        <label className="flex flex-col text-sm">עד<input type="date" value={filters.to} onChange={set("to")} className={select} /></label>
        <label className="flex flex-col text-sm">עסק<select value={filters.business} onChange={set("business")} className={select}><option value="">כל העסקים</option>{options.businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="flex flex-col text-sm">בניין<select value={filters.building} onChange={set("building")} className={select}><option value="">כל הבניינים</option>{options.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="flex flex-col text-sm">סטטוס<select value={filters.status} onChange={set("status")} className={select}><option value="">הכל</option><option value="redeemed">מומש</option><option value="voided">בוטל</option></select></label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {rows && (
        <p className="text-sm text-navy/70">
          {rows.length === 300 ? "300 האחרונים מוצגים (הייצוא כולל הכל). " : `${rows.length} שורות · `}
          {redeemed.length} מומשו · חשבונות {formatShekels(sum("amount"))} · הנחות {formatShekels(sum("discount"))} · עמלה {formatShekels(sum("commission"))}
        </p>
      )}
      {!rows && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {rows && <DataTable columns={COLUMNS} rows={rows} rowKey={(r) => r.id} empty={<EmptyState icon={<Ticket />} title="אין מימושים בסינון הזה" />} />}
    </div>
  );
}
