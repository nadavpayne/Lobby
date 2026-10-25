"use client";

import { useEffect, useState } from "react";
import { isApiError } from "@/lib/api/http";
import { fetchOffers, requestCode } from "@/lib/api/resident";
import { CATEGORIES, type Category } from "@/lib/businesses/categories";
import type { IssuedCode, ResidentOffer } from "@/lib/offers/types";
import { CodeView } from "./CodeView";
import { OfferCard } from "./OfferCard";
import { useResident } from "./ResidentGate";

/** Offers tab: businesses in the building's city, filter by category, get or show a code. */
export default function OffersScreen() {
  const { token, building } = useResident();
  const [offers, setOffers] = useState<ResidentOffer[]>();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [shown, setShown] = useState<IssuedCode | null>(null);
  const [version, setVersion] = useState(0); // bump to reload the list

  useEffect(() => {
    let live = true;
    fetchOffers(token).then((res) => {
      if (!live) return;
      setError(isApiError(res) ? res.error : null);
      if (!isApiError(res)) setOffers(res);
    });
    return () => {
      live = false;
    };
  }, [token, version]);

  /** Gets a new code (or the live one) and shows it full screen. */
  async function getCode(businessId: string) {
    setPendingId(businessId);
    const res = await requestCode(token, businessId);
    setPendingId(null);
    if (isApiError(res)) return setError(res.error);
    setShown(res);
    setVersion((v) => v + 1); // the card now shows "show my code"
  }

  const categories = [...new Set(offers?.map((o) => o.category))];
  const visible = offers?.filter((o) => category === "all" || o.category === category);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">ההטבות שלכם</h1>
        <p className="text-navy/70">{building.address}, {building.city} · דירה {building.apartmentNumber}</p>
      </div>

      {categories.length > 1 && (
        <div role="group" aria-label="סינון לפי קטגוריה" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className="min-h-11 shrink-0 rounded-full border border-navy/20 bg-white px-4 font-medium aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-cream"
            >
              {c === "all" ? "הכל" : (CATEGORIES[c as Category] ?? c)}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!offers && !error && <p className="pt-6 text-center text-lg text-navy/70">טוען…</p>}
      {offers?.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-lg">
          עוד אין עסקים פעילים ב{building.city}. אנחנו מצרפים עכשיו עסקים בשכונה, וההטבות יופיעו כאן.
        </p>
      )}
      {visible?.map((o) => (
        <OfferCard
          key={o.businessId}
          offer={o}
          pending={pendingId === o.businessId}
          onGetCode={() => (o.activeCode ? setShown(o.activeCode) : getCode(o.businessId))}
        />
      ))}

      {shown && <CodeView code={shown} onClose={() => setShown(null)} />}
    </div>
  );
}
