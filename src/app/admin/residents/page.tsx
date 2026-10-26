"use client";

import { Ban, Search, Undo2, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { inputClass } from "@/components/Field";
import { Button, DataTable, EmptyState, Skeleton, Tag, type Column } from "@/components/ui";
import { fetchResidents, setResidentBlocked } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminResident } from "@/lib/admin/residents";
import { formatAgorot } from "@/lib/qr/money";

const date = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });
const STATUS: Record<AdminResident["status"], [string, "mint" | "sky" | "rose"]> = { active: ["פעיל", "mint"], pending: ["ממתין", "sky"], blocked: ["חסום", "rose"] };

/** Residents: search by name/phone, see apartment, building and activity, block or unblock. ?building= shows one building. */
function ResidentsScreen() {
  const { token } = useAccount();
  const params = useSearchParams();
  const building = params.get("building");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [list, setList] = useState<AdminResident[]>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const id = setTimeout(() => fetchResidents(token, q.trim(), building).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setList(res);
    }), 250);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [token, q, building]);

  /** Blocks or unblocks after confirming. */
  async function toggle(r: AdminResident) {
    const block = r.status !== "blocked";
    if (block && !confirm(`לחסום את ${r.name ?? "הדייר"}? הוא לא יוכל להיכנס לאפליקציה ולקבל קודים.`)) return;
    const res = await setResidentBlocked(token, r.id, block);
    if (isApiError(res)) return setError(res.error);
    setList((l) => l?.map((x) => (x.id === r.id ? { ...x, status: block ? "blocked" : "active" } : x)));
  }

  const columns: Column<AdminResident>[] = [
    {
      key: "name", header: "שם", render: (r) => (
        <Link href={`/admin/residents/${r.id}`} className="group font-medium">
          <span className="group-hover:underline">{r.name ?? "ללא שם"}</span>
          {r.role === "committee" && <span className="ms-1 text-sm text-muted">(ועד)</span>}
          {r.phone && <span dir="ltr" className="block text-sm font-normal text-muted">{r.phone}</span>}
        </Link>
      ),
    },
    { key: "building", header: "בניין", render: (r) => <span>{r.building}<span className="block text-sm text-muted">דירה {r.apartment}</span></span> },
    { key: "joined", header: "הצטרף", render: (r) => date.format(new Date(r.joinedAt)) },
    { key: "used", header: "מימושים", align: "end", render: (r) => r.redemptions },
    { key: "saved", header: "חיסכון", align: "end", render: (r) => <bdi dir="ltr">{formatAgorot(r.savedAgorot)}</bdi> },
    { key: "last", header: "מימוש אחרון", render: (r) => (r.lastRedemption ? date.format(new Date(r.lastRedemption)) : "—") },
    { key: "status", header: "סטטוס", render: (r) => <Tag tint={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag> },
    {
      key: "action", header: "", render: (r) => (
        <Button size="sm" variant={r.status === "blocked" ? "secondary" : "ghost"} onClick={() => toggle(r)}>
          {r.status === "blocked" ? <><Undo2 aria-hidden className="size-4" /> שחרור</> : <><Ban aria-hidden className="size-4" /> חסימה</>}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {building ? (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {/* The building's name comes from its residents; an empty building shows a generic title. */}
          <h1 className="text-3xl font-bold">{list?.[0] ? `דיירי ${list[0].building}` : "דיירי הבניין"}</h1>
          <Link href="/admin/residents" className="font-bold underline">כל הדיירים</Link>
        </div>
      ) : (
        <h1 className="text-3xl font-bold">דיירים</h1>
      )}
      <label className="relative max-w-md">
        <span className="sr-only">חיפוש דייר</span>
        <Search aria-hidden className="absolute inset-y-0 start-3 my-auto size-5 text-navy/50" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם או טלפון" className={`${inputClass} ps-10`} />
      </label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!list && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {list && <p className="text-sm text-muted">{list.length === 200 ? "200 התוצאות האחרונות. חפשו כדי לצמצם." : `${list.length} דיירים`}</p>}
      {list && <DataTable columns={columns} rows={list} rowKey={(r) => r.id} empty={<EmptyState icon={<Users />} title={building && !q ? "עוד אין דיירים בבניין הזה" : "לא נמצאו דיירים"} />} />}
    </div>
  );
}

/** useSearchParams needs a Suspense boundary. */
export default function ResidentsPage() {
  return <Suspense><ResidentsScreen /></Suspense>;
}
