"use client";

import { ChevronDown, Link2, X } from "lucide-react";
import { useState } from "react";
import { Button, Card, Tag } from "@/components/ui";
import { setBusinessCommission, setBusinessStage } from "@/lib/api/admin";
import { isApiError, type ApiError } from "@/lib/api/http";
import type { AdminBusiness } from "@/lib/admin/types";
import { CATEGORIES, type Category } from "@/lib/businesses/categories";
import type { BusinessStatus } from "@/lib/businesses/types";
import { BusinessLogo } from "@/components/resident/BusinessCover";
import { OfferReview } from "./OfferReview";

export const STAGE_LABEL: Record<BusinessStatus, string> = { lead: "ליד", pending: "במו״מ", active: "פעיל", paused: "מושהה", declined: "נדחה" };
const STAGE_TINT: Record<BusinessStatus, "white" | "sky" | "mint" | "rose"> = { lead: "white", pending: "sky", active: "mint", paused: "rose", declined: "rose" };
const STAGES: BusinessStatus[] = ["lead", "pending", "active", "paused", "declined"];

interface Props {
  token: string;
  business: AdminBusiness;
  focused: boolean;
  onChanged: (b: AdminBusiness) => void;
}

/** One business: stage, contact, contract rate, terminal link, and (expanded) its offers for review. */
export function BusinessRow({ token, business: b, focused, onChanged }: Props) {
  const pendingOffers = b.offers.filter((o) => !o.approved && o.active).length;
  const [open, setOpen] = useState(focused || pendingOffers > 0);
  const [rate, setRate] = useState(String(b.commissionPercent));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /** Applies a server call that returns the updated business. */
  async function apply(call: Promise<AdminBusiness | ApiError>) {
    const res = await call;
    if (isApiError(res)) return setError(res.error);
    setError(null);
    onChanged(res);
  }

  return (
    <Card as="article" className={`flex flex-col gap-3 p-4 ${focused ? "ring-2 ring-amber" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <ChevronDown aria-hidden className={`size-5 shrink-0 transition ${open ? "" : "rotate-90 rtl:-rotate-90"}`} />
          <BusinessLogo name={b.name} logoUrl={b.logoUrl} className="size-12 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold">{b.name}{b.isDemo && <span className="ms-2 text-sm font-normal text-navy/50">(הדגמה)</span>}</span>
            <span className="block truncate text-sm text-navy/60">{CATEGORIES[b.category as Category] ?? b.category} · {b.address}{b.city ? `, ${b.city}` : ""}</span>
          </span>
        </button>
        {pendingOffers > 0 && <Tag tint="amber">{pendingOffers} לאישור</Tag>}
        <Tag tint={STAGE_TINT[b.status]}>{STAGE_LABEL[b.status]}</Tag>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-navy/10 pt-3">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p>{b.contactName} · <a href={`tel:${b.phone}`} dir="ltr" className="underline">{b.phone}</a><br /><a href={`mailto:${b.email}`} dir="ltr" className="break-all underline">{b.email}</a></p>
            <label className="flex flex-col gap-1">
              שלב בצנרת
              <select value={b.status} onChange={(e) => apply(setBusinessStage(token, b.id, e.target.value as BusinessStatus))} className="min-h-10 rounded-lg border border-navy/25 bg-white px-2">
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
              </select>
            </label>
            <div className="flex flex-col gap-1">
              עמלת לובי (חוזה)
              <span className="flex gap-2">
                <input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="decimal" dir="ltr" className="min-h-10 w-20 rounded-lg border border-navy/25 px-2 text-center" aria-label="אחוז עמלה" />
                <span className="self-center">%</span>
                {Number(rate) !== b.commissionPercent && <Button size="sm" variant="navy" onClick={() => apply(setBusinessCommission(token, b.id, Number(rate)))}>שמירה</Button>}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Button size="sm" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(b.verifyUrl).catch(() => null); setCopied(true); }}>
              <Link2 aria-hidden className="size-4" /> {copied ? "הועתק" : "קישור לקופה"}
            </Button>
            <span className="text-navy/50">נוסף {new Date(b.createdAt).toLocaleDateString("he-IL")}</span>
            {(b.status === "lead" || b.status === "pending") && (
              <Button size="sm" variant="danger" className="ms-auto" onClick={() => confirm(`לדחות את ${b.name}? העסק לא יוכל לאמת קודים, וההטבות שלו לא יוצגו לדיירים.`) && apply(setBusinessStage(token, b.id, "declined"))}>
                <X aria-hidden className="size-4" /> דחיית העסק
              </Button>
            )}
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <h3 className="font-bold">הטבות</h3>
          {b.offers.length === 0 && <p className="text-sm text-navy/60">עוד אין הטבות.</p>}
          {b.offers.map((o) => <OfferReview key={o.id} token={token} offer={o} onChanged={onChanged} />)}
        </div>
      )}
    </Card>
  );
}
