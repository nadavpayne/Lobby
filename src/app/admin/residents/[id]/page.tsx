"use client";

import { ArrowRight, ReceiptText, Ticket, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Card, DataTable, DetailRow, EmptyState, Skeleton, StatTile, Tag, type Column } from "@/components/ui";
import { fetchResident } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { ResidentDetail, ResidentRedemption } from "@/lib/admin/residentDetail";
import { formatAgorot } from "@/lib/qr/money";

const date = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit" });
const dateTime = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit", hour: "2-digit", minute: "2-digit" });
const STATUS: Record<ResidentDetail["status"], [string, "mint" | "sky" | "rose"]> = { active: ["פעיל", "mint"], pending: ["ממתין", "sky"], blocked: ["חסום", "rose"] };
const money = (agorot: number) => <bdi dir="ltr">{formatAgorot(agorot)}</bdi>;

const COLUMNS: Column<ResidentRedemption>[] = [
  { key: "at", header: "תאריך", render: (u) => dateTime.format(new Date(u.redeemedAt)) },
  { key: "business", header: "עסק", render: (u) => (u.businessId ? <Link href={`/admin/businesses?focus=${u.businessId}`} className="font-medium underline">{u.business}</Link> : u.business) },
  { key: "offer", header: "הטבה", render: (u) => u.offer },
  { key: "bill", header: "חשבון", align: "end", render: (u) => money(u.billAgorot) },
  { key: "saved", header: "חיסכון", align: "end", render: (u) => <span className="font-bold">{money(u.savedAgorot)}</span> },
];

/** /admin/residents/[id] — one resident: contact details, apartment, totals and every coupon they used. */
export default function ResidentPage() {
  const { token } = useAccount();
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<ResidentDetail>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchResident(token, id).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setR(res);
    });
    return () => {
      live = false;
    };
  }, [token, id]);

  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!r) return <Skeleton className="h-96 w-full rounded-3xl" />;

  return (
    <div className="flex flex-col gap-5">
      <Link href={r.buildingId ? `/admin/residents?building=${r.buildingId}` : "/admin/residents"} className="inline-flex items-center gap-1 self-start font-bold underline">
        <ArrowRight aria-hidden className="size-4" /> {r.building ? `דיירי ${r.building}` : "כל הדיירים"}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">{r.name ?? "דייר ללא שם"}</h1>
        {r.role === "committee" && <Tag tint="lilac">ועד הבית</Tag>}
        <Tag tint={STATUS[r.status][1]}>{STATUS[r.status][0]}</Tag>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="flex flex-col gap-3 p-5">
          <DetailRow label="טלפון">{r.phone ? <a href={`tel:${r.phone}`} dir="ltr" className="underline">{r.phone}</a> : "לא נמסר"}</DetailRow>
          <DetailRow label="אימייל">{r.email ? <a href={`mailto:${r.email}`} dir="ltr" className="break-all underline">{r.email}</a> : "לא נמסר"}</DetailRow>
          <DetailRow label="בניין">{r.building ?? "ללא בניין"}</DetailRow>
          <DetailRow label="דירה">{r.apartment ?? "ללא"}</DetailRow>
          <DetailRow label="הצטרף">{date.format(new Date(r.joinedAt))}</DetailRow>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="מימושים" value={r.totals.redemptions} icon={<Ticket />} />
          <StatTile label="סך החשבונות" value={money(r.totals.billAgorot)} icon={<ReceiptText />} />
          <StatTile label="סך החיסכון" value={money(r.totals.savedAgorot)} icon={<Wallet />} tint="mint" />
        </div>
      </div>

      <h2 className="text-2xl font-bold">הטבות שמימש</h2>
      <DataTable columns={COLUMNS} rows={r.redemptions} rowKey={(u) => u.id} empty={<EmptyState icon={<Ticket />} title="עוד לא מימש הטבות" />} />
    </div>
  );
}
