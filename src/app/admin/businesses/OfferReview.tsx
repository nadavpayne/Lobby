"use client";

import { Check, Pause, Play, Star, Undo2 } from "lucide-react";
import { useState } from "react";
import { Button, Tag } from "@/components/ui";
import { offerAction } from "@/lib/api/admin";
import { isApiError } from "@/lib/api/http";
import type { OfferAction } from "@/lib/admin/offers";
import type { AdminBusiness, AdminOffer } from "@/lib/admin/types";

const day = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", year: "2-digit", timeZone: "Asia/Jerusalem" });

interface Props {
  token: string;
  offer: AdminOffer;
  onChanged: (b: AdminBusiness) => void;
}

/** One offer under review: text, dates, status, and approve / feature / discount override / pause. */
export function OfferReview({ token, offer: o, onChanged }: Props) {
  const [discount, setDiscount] = useState(String(o.discountPercent));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Runs an admin action on this offer. */
  async function run(action: OfferAction) {
    setBusy(true);
    const res = await offerAction(token, o.id, action);
    setBusy(false);
    if (isApiError(res)) return setError(res.error);
    setError(null);
    onChanged(res);
  }

  const newDiscount = Number(discount);
  return (
    <div className={`flex flex-col gap-2 rounded-2xl border p-3 ${o.approved ? "border-navy/10" : "border-amber bg-peach/40"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-bold">{o.title}</span>
        {!o.approved && <Tag tint="amber">ממתינה לאישור</Tag>}
        {o.approved && o.active && <Tag tint="mint">פעילה</Tag>}
        {!o.active && <Tag tint="white">מושהית</Tag>}
        {o.featured && <Tag tint="lilac" icon={<Star />}>מומלצת</Tag>}
      </div>
      <p className="text-sm">{o.description}{o.terms && <span className="text-navy/60"> · תנאים: {o.terms}</span>}</p>
      {(o.startsAt || o.endsAt) && <p className="text-sm text-navy/60">{o.startsAt ? day.format(new Date(o.startsAt)) : "מעכשיו"} – {o.endsAt ? day.format(new Date(o.endsAt)) : "ללא סיום"}</p>}
      <div className="flex flex-wrap items-center gap-2">
        {o.approved
          ? <Button size="sm" variant="ghost" onClick={() => run({ action: "unapprove" })} disabled={busy}><Undo2 aria-hidden className="size-4" /> ביטול אישור</Button>
          : <Button size="sm" onClick={() => run({ action: "approve" })} disabled={busy}><Check aria-hidden className="size-4" /> אישור</Button>}
        <Button size="sm" variant="ghost" onClick={() => run({ action: "featured", featured: !o.featured })} disabled={busy || !o.approved}>
          <Star aria-hidden className="size-4" /> {o.featured ? "הסרה מהמומלצות" : "למומלצות"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => run({ action: "active", active: !o.active })} disabled={busy}>
          {o.active ? <><Pause aria-hidden className="size-4" /> השהיה</> : <><Play aria-hidden className="size-4 rtl:-scale-x-100" /> הפעלה</>}
        </Button>
        <label className="ms-auto inline-flex items-center gap-1 text-sm">
          הנחה
          <input value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" dir="ltr" className="h-9 w-14 rounded-lg border border-navy/25 px-2 text-center" />%
        </label>
        {newDiscount !== o.discountPercent && (
          <Button size="sm" variant="navy" onClick={() => run({ action: "discount", discountPercent: newDiscount })} disabled={busy || !(newDiscount >= 1 && newDiscount <= 100)}>עדכון</Button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
