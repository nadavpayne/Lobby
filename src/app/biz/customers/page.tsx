"use client";

import { Search, StickyNote, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { inputClass } from "@/components/Field";
import { Chip, ChipRow, DataTable, EmptyState, Skeleton, Tag, type Column } from "@/components/ui";
import { fetchCustomers } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { Customer } from "@/lib/biz/types";
import { formatShekels } from "@/lib/redemptions/money";
import { useBiz } from "../BizShell";
import { NoteEditor } from "./NoteEditor";

const date = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });

const COLUMNS: Column<Customer>[] = [
  { key: "name", header: "שם", render: (c) => <span className="font-medium">{c.firstName}</span> },
  { key: "building", header: "בניין", render: (c) => c.building },
  { key: "visits", header: "ביקורים", align: "end", render: (c) => c.visits },
  { key: "spent", header: "סה״כ קנייה", align: "end", render: (c) => <bdi dir="ltr">{formatShekels(c.totalSpent)}</bdi> },
  { key: "last", header: "ביקור אחרון", render: (c) => date.format(new Date(c.lastVisit)) },
  { key: "tags", header: "תגיות", render: (c) => <span className="flex gap-1">{c.tags.map((t) => <Tag key={t} tint="lilac">{t}</Tag>)}{c.note && <Tag tint="white" icon={<StickyNote />}>הערה</Tag>}</span> },
];

/** Lobby customers: search, filter by building or tag, open one to keep a note and tags. */
export default function CustomersScreen() {
  const { token } = useBiz();
  const [customers, setCustomers] = useState<Customer[]>();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [building, setBuilding] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [open, setOpen] = useState<Customer | null>(null);

  useEffect(() => {
    let live = true;
    fetchCustomers(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setCustomers(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  const buildings = [...new Set(customers?.map((c) => c.building))].sort();
  const tags = [...new Set(customers?.flatMap((c) => c.tags))].sort();
  const q = query.trim();
  const visible = customers?.filter(
    (c) => (!q || c.firstName.includes(q) || c.building.includes(q)) && (!building || c.building === building) && (!tag || c.tags.includes(tag)),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold">לקוחות</h1>
        {customers && <p className="text-navy/70">{customers.length} לקוחות מלובי</p>}
      </div>

      <label className="relative">
        <span className="sr-only">חיפוש לקוח</span>
        <Search aria-hidden className="absolute inset-y-0 start-3 my-auto size-5 text-navy/50" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש לפי שם או בניין" className={`${inputClass} ps-10`} />
      </label>
      {buildings.length > 1 && (
        <ChipRow label="סינון לפי בניין">
          <Chip selected={!building} onClick={() => setBuilding(null)}>כל הבניינים</Chip>
          {buildings.map((b) => <Chip key={b} selected={building === b} onClick={() => setBuilding(b)}>{b}</Chip>)}
        </ChipRow>
      )}
      {tags.length > 0 && (
        <ChipRow label="סינון לפי תגית">
          {tags.map((t) => <Chip key={t} selected={tag === t} onClick={() => setTag(tag === t ? null : t)}>#{t}</Chip>)}
        </ChipRow>
      )}

      {!customers && <Skeleton className="h-64 w-full rounded-3xl" />}
      {visible && (
        <DataTable
          columns={COLUMNS}
          rows={visible}
          rowKey={(c) => c.residentId}
          onRowClick={setOpen}
          empty={<EmptyState icon={<Users />} title={customers!.length ? "אין התאמות" : "עוד אין לקוחות"}>{customers!.length ? "נסו חיפוש או סינון אחר." : "כשדיירים יממשו אצלכם הטבה, הם יופיעו כאן."}</EmptyState>}
        />
      )}
      <NoteEditor
        customer={open}
        token={token}
        onClose={() => setOpen(null)}
        onSaved={(c) => {
          setCustomers((list) => list?.map((x) => (x.residentId === c.residentId ? c : x)));
          setOpen(null);
        }}
      />
    </div>
  );
}
