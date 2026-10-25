"use client";

import { Building2, FileText, Link2, Pencil, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAccount } from "@/components/auth/RoleGate";
import { Button, Chip, ChipRow, DataTable, EmptyState, Skeleton, Tag, type Column } from "@/components/ui";
import { fetchBuildings, newInvite } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { AdminBuilding } from "@/lib/admin/buildings";
import { BUILDING_STAGES, type BuildingStage } from "@/lib/admin/validate";
import { formatShekels } from "@/lib/redemptions/money";
import { BuildingForm, STAGE_LABEL } from "./BuildingForm";

const STAGE_TINT: Record<BuildingStage, "white" | "sky" | "mint"> = { lead: "white", contacted: "sky", joined: "mint" };

/** Buildings & committees: pipeline stages, join rate, invite links, monthly committee report. */
function BuildingsScreen() {
  const { token } = useAccount();
  const focus = useSearchParams().get("focus");
  const [list, setList] = useState<AdminBuilding[]>();
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<BuildingStage | null>(null);
  const [editing, setEditing] = useState<AdminBuilding | "new" | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchBuildings(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setList(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  /** Copies a building's invite link. */
  async function copyInvite(b: AdminBuilding) {
    await navigator.clipboard.writeText(b.inviteUrl).catch(() => null);
    setCopied(b.id);
  }

  /** Issues a new invite link after confirming (the old one stops working). */
  async function regenerate(b: AdminBuilding) {
    if (!confirm(`להנפיק קישור הצטרפות חדש ל${b.name ?? b.address}? הקישור הקודם יפסיק לעבוד.`)) return;
    const res = await newInvite(token, b.id);
    if (isApiError(res)) setError(res.error);
    else setList(res);
  }

  const columns: Column<AdminBuilding>[] = [
    { key: "name", header: "בניין", render: (b) => <span className={`font-medium ${b.id === focus ? "rounded bg-amber/30 px-1" : ""}`}>{b.name ?? b.address}<span className="block text-sm font-normal text-navy/60">{b.address}, {b.city}</span></span> },
    { key: "stage", header: "שלב", render: (b) => <Tag tint={STAGE_TINT[b.pipeline]}>{STAGE_LABEL[b.pipeline]}</Tag> },
    { key: "contact", header: "ועד", render: (b) => <span>{b.committeeName ?? "—"}{b.committeePhone && <a href={`tel:${b.committeePhone}`} dir="ltr" className="block text-sm text-navy/60 underline">{b.committeePhone}</a>}</span> },
    { key: "join", header: "הצטרפות", align: "end", render: (b) => <span>{b.apartmentsJoined}/{b.apartmentCount}<span className="block text-sm text-navy/60">{b.apartmentCount ? Math.round((b.apartmentsJoined / b.apartmentCount) * 100) : 0}%</span></span> },
    { key: "month", header: "מימושים החודש", align: "end", render: (b) => b.redemptionsThisMonth },
    { key: "saved", header: "חיסכון הדיירים", align: "end", render: (b) => <bdi dir="ltr">{formatShekels(b.savedThisMonth)}</bdi> },
    {
      key: "actions", header: "", render: (b) => (
        <span className="flex gap-1">
          <button type="button" onClick={() => setEditing(b)} aria-label="עריכה" className="grid size-9 place-items-center rounded-lg hover:bg-navy/5"><Pencil aria-hidden className="size-4" /></button>
          <button type="button" onClick={() => copyInvite(b)} aria-label="העתקת קישור הצטרפות" title={copied === b.id ? "הועתק" : "העתקת קישור הצטרפות"} className="grid size-9 place-items-center rounded-lg hover:bg-navy/5"><Link2 aria-hidden className={`size-4 ${copied === b.id ? "text-emerald-700" : ""}`} /></button>
          <button type="button" onClick={() => regenerate(b)} aria-label="קישור הצטרפות חדש" title="קישור הצטרפות חדש" className="grid size-9 place-items-center rounded-lg hover:bg-navy/5"><RefreshCw aria-hidden className="size-4" /></button>
          <Link href={`/admin/buildings/${b.id}/report`} aria-label="דוח חודשי לוועד" title="דוח חודשי לוועד" className="grid size-9 place-items-center rounded-lg hover:bg-navy/5"><FileText aria-hidden className="size-4" /></Link>
        </span>
      ),
    },
  ];

  const visible = list?.filter((b) => !stage || b.pipeline === stage);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">בניינים וועדים</h1>
        <Button size="md" onClick={() => setEditing("new")}><Plus aria-hidden className="size-5" /> בניין חדש</Button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      <ChipRow label="סינון לפי שלב">
        <Chip selected={!stage} onClick={() => setStage(null)}>הכל {list && `(${list.length})`}</Chip>
        {BUILDING_STAGES.map((s) => <Chip key={s} selected={stage === s} onClick={() => setStage(s)}>{STAGE_LABEL[s]} {list && `(${list.filter((b) => b.pipeline === s).length})`}</Chip>)}
      </ChipRow>
      {!list && !error && <Skeleton className="h-64 w-full rounded-3xl" />}
      {visible && <DataTable columns={columns} rows={visible} rowKey={(b) => b.id} empty={<EmptyState icon={<Building2 />} title="אין בניינים בשלב הזה" />} />}
      <BuildingForm token={token} editing={editing} onClose={() => setEditing(null)} onSaved={(l) => { setList(l); setEditing(null); }} />
    </div>
  );
}

/** useSearchParams needs a Suspense boundary. */
export default function BuildingsPage() {
  return <Suspense><BuildingsScreen /></Suspense>;
}
