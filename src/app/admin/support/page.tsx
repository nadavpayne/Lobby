"use client";

import { LifeBuoy, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { EmptyState, Skeleton, Tag, type Tint } from "@/components/ui";
import { fetchSupportRequests, setSupportRequestStatus } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import { SUPPORT_ROLES, SUPPORT_TOPICS } from "@/lib/support/config";
import type { AdminSupportRequest } from "@/lib/support/requests";

const when = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
const select = "min-h-11 rounded-xl border border-navy/25 bg-white px-3";
const STATUS: Record<AdminSupportRequest["status"], [string, Tint]> = { open: ["פתוח", "peach"], answered: ["נענה", "sky"], closed: ["סגור", "white"] };
const label = (list: readonly (readonly [string, string])[], v: string) => list.find(([k]) => k === v)?.[1] ?? v;

/** /admin/support — requests from the support form, with status and filters by status, topic and role. */
export default function SupportRequestsScreen() {
  const { token } = useAccount();
  const [filters, setFilters] = useState({ status: "open", topic: "", role: "" });
  const [rows, setRows] = useState<AdminSupportRequest[]>();
  const [error, setError] = useState<string | null>(null);
  const [reloads, setReloads] = useState(0);
  const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();

  useEffect(() => {
    let live = true;
    fetchSupportRequests(token, query).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setRows(res);
    });
    return () => {
      live = false;
    };
  }, [token, query, reloads]);

  const set = (k: keyof typeof filters) => (e: { target: { value: string } }) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  /** Changes a request's status and reloads the list. */
  async function move(id: string, status: AdminSupportRequest["status"]) {
    const res = await setSupportRequestStatus(token, id, status);
    if (isApiError(res)) setError(res.error);
    else setReloads((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">פניות תמיכה</h1>
      <div className="flex flex-wrap items-end gap-2 rounded-3xl bg-white p-3 shadow-soft">
        <label className="flex flex-col text-sm">סטטוס<select value={filters.status} onChange={set("status")} className={select}><option value="">הכל</option>{Object.entries(STATUS).map(([v, [l]]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex flex-col text-sm">נושא<select value={filters.topic} onChange={set("topic")} className={select}><option value="">הכל</option>{SUPPORT_TOPICS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex flex-col text-sm">פונה<select value={filters.role} onChange={set("role")} className={select}><option value="">הכל</option>{SUPPORT_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!rows && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {rows?.length === 0 && <EmptyState icon={<LifeBuoy />} title="אין פניות בסינון הזה" />}
      <ul className="flex flex-col gap-3">
        {rows?.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-3xl bg-white p-4 shadow-soft">
            <div className="flex flex-wrap items-center gap-2">
              <Tag tint={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag>
              <span className="font-bold">{label(SUPPORT_TOPICS, r.topic)}</span>
              <span className="text-sm text-navy/60">{label(SUPPORT_ROLES, r.role)} · <bdi dir="ltr">{when.format(new Date(r.createdAt))}</bdi>{r.emailed ? "" : " · לא נשלח במייל"}</span>
            </div>
            <p className="whitespace-pre-line">{r.message}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span>{r.name}</span>
              <a href={`mailto:${r.email}`} dir="ltr" className="inline-flex items-center gap-1 underline"><Mail aria-hidden className="size-4" />{r.email}</a>
              <select value={r.status} onChange={(e) => move(r.id, e.target.value as AdminSupportRequest["status"])} aria-label="סטטוס הפנייה" className={`${select} ms-auto`}>
                {Object.entries(STATUS).map(([v, [l]]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
