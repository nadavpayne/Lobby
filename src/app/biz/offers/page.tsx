"use client";

import { CalendarRange, Megaphone, Pause, Pencil, Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Skeleton, Tag } from "@/components/ui";
import { fetchBizOffers, setOfferActive } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import type { BizOffer } from "@/lib/biz/types";
import { useBiz } from "../BizShell";
import { OfferForm } from "./OfferForm";

const dayMonth = (day: string) => `${Number(day.slice(8, 10))}.${Number(day.slice(5, 7))}.${day.slice(2, 4)}`;

/** Status tags for an offer: waiting for approval / live / paused. */
function OfferStatus({ offer: o }: { offer: BizOffer }) {
  if (!o.active) return <Tag tint="white">מושהית</Tag>;
  if (!o.approved) return <Tag tint="peach">ממתינה לאישור לובי</Tag>;
  return <Tag tint="mint">פעילה לדיירים</Tag>;
}

/** /biz/offers — my benefits: create/edit with preview, pause/activate. */
export default function OffersScreen() {
  const { token, business } = useBiz();
  const [offers, setOffers] = useState<BizOffer[]>();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BizOffer | "new" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchBizOffers(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setOffers(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  /** Replaces (or prepends) an offer in the list. */
  const upsert = (o: BizOffer) => setOffers((list) => (list?.some((x) => x.id === o.id) ? list.map((x) => (x.id === o.id ? o : x)) : [o, ...(list ?? [])]));

  /** Pauses or re-activates an offer. */
  async function toggle(o: BizOffer) {
    setBusyId(o.id);
    const res = await setOfferActive(token, o.id, !o.active);
    setBusyId(null);
    if (isApiError(res)) return setError(res.error);
    upsert(res);
  }

  if (editing) {
    return (
      <OfferForm
        token={token}
        businessName={business.name}
        logoUrl={business.logoUrl}
        offer={editing === "new" ? null : editing}
        defaultCategory={offers?.[0]?.category ?? "restaurants"}
        onCancel={() => setEditing(null)}
        onSaved={(o) => {
          upsert(o);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">ההטבות שלי</h1>
        <Button size="md" onClick={() => setEditing("new")}><Plus aria-hidden className="size-5" /> הטבה חדשה</Button>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!offers && !error && <Skeleton className="h-40 w-full rounded-3xl" />}
      {offers?.length === 0 && (
        <EmptyState icon={<Megaphone />} title="עוד אין הטבות" action={<Button size="md" onClick={() => setEditing("new")}>יצירת הטבה ראשונה</Button>}>
          ההצעה הנפוצה בלובי: 10% הנחה לדיירים על כל הקנייה.
        </EmptyState>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {offers?.map((o) => (
          <Card key={o.id} as="article" className={`flex flex-col gap-3 ${o.active ? "" : "opacity-70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold">{o.title}</h2>
                <p className="text-sm text-navy/70">{o.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-amber px-3 py-1 font-bold"><bdi dir="ltr">{o.discountPercent}%</bdi></span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <OfferStatus offer={o} />
              {(o.startsOn || o.endsOn) && (
                <Tag tint="sky" icon={<CalendarRange />}>{o.startsOn ? dayMonth(o.startsOn) : "מעכשיו"} – {o.endsOn ? dayMonth(o.endsOn) : "ללא סיום"}</Tag>
              )}
            </div>
            {o.terms && <p className="text-sm text-navy/70">תנאים: {o.terms}</p>}
            <div className="mt-auto grid grid-cols-2 gap-2">
              <Button size="md" variant="secondary" onClick={() => setEditing(o)}><Pencil aria-hidden className="size-4" /> עריכה</Button>
              <Button size="md" variant={o.active ? "ghost" : "navy"} onClick={() => toggle(o)} disabled={busyId === o.id}>
                {o.active ? <><Pause aria-hidden className="size-4" /> השהיה</> : <><Play aria-hidden className="size-4 rtl:-scale-x-100" /> הפעלה</>}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
