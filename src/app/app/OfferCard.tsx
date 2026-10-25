"use client";

import { primaryButton, secondaryButton } from "@/components/ui";
import { CATEGORIES, type Category } from "@/lib/businesses/categories";
import type { ResidentOffer } from "@/lib/offers/types";

interface Props {
  offer: ResidentOffer;
  pending: boolean;
  onGetCode: () => void;
}

/** One business's offer with the action that fits this month's state. */
export function OfferCard({ offer: o, pending, onGetCode }: Props) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold">{o.businessName}</h2>
          <p className="text-navy/70">
            {CATEGORIES[o.category as Category] ?? o.category} · {o.address}
          </p>
        </div>
        <p className="shrink-0 rounded-full bg-amber px-3 py-1 text-lg font-bold">
          <bdi dir="ltr">{o.discountPercent}%</bdi>
        </p>
      </div>
      <p className="text-lg">{o.description}</p>
      {o.terms && <p className="text-sm text-navy/70">{o.terms}</p>}
      {o.remaining !== null && o.state === "available" && <p className="text-sm font-medium">נשארו {o.remaining} מימושים בבניין</p>}

      {o.state === "available" && (
        <button type="button" onClick={onGetCode} disabled={pending} className={primaryButton}>
          {pending ? "מכינים קוד…" : "קבלת קוד"}
        </button>
      )}
      {o.state === "active" && (
        <button type="button" onClick={onGetCode} className={primaryButton}>הצגת הקוד שלי</button>
      )}
      {o.state === "used" && <p className={`${secondaryButton} opacity-60`}>מימשתם החודש · שוב בחודש הבא</p>}
      {o.state === "sold_out" && <p className={`${secondaryButton} opacity-60`}>ההטבה אזלה בבניין</p>}
    </article>
  );
}
