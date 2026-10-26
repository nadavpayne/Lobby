"use client";

import { Camera, MessageSquareWarning } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { DataTable, EmptyState, Skeleton, Tag, type Column } from "@/components/ui";
import { fetchAdminBusinesses, fetchDisputes } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminDisputeRow } from "@/lib/disputes/types";
import { formatAgorot } from "@/lib/qr/money";
import { DisputeDetail } from "./DisputeDetail";
import { ageLabel, REASON_LABEL, STATUS_LABEL } from "./labels";

const day = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric" });
const money = (a: number | null) => (a === null ? "—" : <bdi dir="ltr">{formatAgorot(a)}</bdi>);
const select = "min-h-11 rounded-xl border border-navy/25 bg-white px-3";

const COLUMNS: Column<AdminDisputeRow>[] = [
  { key: "business", header: "עסק", render: (d) => <span className="font-medium">{d.businessName}<span className="block text-sm font-normal text-navy/60">{REASON_LABEL[d.reason]}</span></span> },
  { key: "date", header: "מימוש", render: (d) => <span>{day.format(new Date(d.redeemedAt))}<span className="block text-sm text-navy/60">{d.building} · דירה {d.apartment}</span></span> },
  { key: "recorded", header: "נרשם", align: "end", render: (d) => money(d.recordedBillAgorot) },
  { key: "claimed", header: "לפי הדייר", align: "end", render: (d) => money(d.claimedBillAgorot) },
  { key: "diff", header: "הפרש", align: "end", render: (d) => (d.claimedBillAgorot === null ? "—" : <span className="font-bold">{money(d.claimedBillAgorot - d.recordedBillAgorot)}</span>) },
  { key: "photo", header: "קבלה", render: (d) => (d.hasPhoto ? <Camera aria-label="יש צילום קבלה" className="size-5" /> : <span className="text-navy/40">אין</span>) },
  { key: "status", header: "סטטוס", render: (d) => <span className="flex flex-col items-start gap-1"><Tag tint={STATUS_LABEL[d.status][1]}>{STATUS_LABEL[d.status][0]}</Tag><span className="text-sm text-navy/60">{ageLabel(d.createdAt)}</span></span> },
];

/** Residents' "the amount isn't right" reports: the queue (oldest open first) and each report's detail. */
function DisputesScreen() {
  const { token } = useAccount();
  const params = useSearchParams();
  const [filters, setFilters] = useState({ status: "active", business: params.get("business") ?? "", reason: "", from: "", to: "" });
  const [rows, setRows] = useState<AdminDisputeRow[]>();
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  useEffect(() => {
    fetchAdminBusinesses(token).then((res) => setBusinesses(isApiError(res) ? [] : res.filter((b) => !b.isDemo).map((b) => ({ id: b.id, name: b.name }))));
  }, [token]);

  useEffect(() => {
    let live = true;
    fetchDisputes(token, query).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setRows(res);
    });
    return () => {
      live = false;
    };
  }, [token, query, reloads]);

  const set = (k: keyof typeof filters) => (e: { target: { value: string } }) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">דיווחים על סכומים</h1>
      <p className="text-navy/70">דיירים שדיווחו שהסכום שנרשם בקופה לא נכון. תיקון מעדכן את ההנחה ואת העמלה של העסק.</p>
      <div className="flex flex-wrap items-end gap-2 rounded-3xl bg-white p-3 shadow-soft">
        <label className="flex flex-col text-sm">סטטוס
          <select value={filters.status} onChange={set("status")} className={select}>
            <option value="active">פתוחים ובבדיקה</option>
            {Object.entries(STATUS_LABEL).map(([v, [l]]) => <option key={v} value={v}>{l}</option>)}
            <option value="all">הכל</option>
          </select>
        </label>
        <label className="flex flex-col text-sm">עסק<select value={filters.business} onChange={set("business")} className={select}><option value="">כל העסקים</option>{businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="flex flex-col text-sm">סיבה<select value={filters.reason} onChange={set("reason")} className={select}><option value="">הכל</option>{Object.entries(REASON_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex flex-col text-sm">מתאריך<input type="date" value={filters.from} onChange={set("from")} className={select} /></label>
        <label className="flex flex-col text-sm">עד<input type="date" value={filters.to} onChange={set("to")} className={select} /></label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!rows && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {rows && (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(d) => d.id}
          onRowClick={(d) => setOpenId(d.id)}
          empty={<EmptyState icon={<MessageSquareWarning />} title="אין דיווחים בסינון הזה" />}
        />
      )}
      <DisputeDetail token={token} id={openId} onClose={() => setOpenId(null)} onChanged={() => setReloads((n) => n + 1)} />
    </div>
  );
}

/** /admin/disputes — Suspense boundary for the ?business= filter (useSearchParams). */
export default function DisputesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-3xl" />}>
      <DisputesScreen />
    </Suspense>
  );
}
