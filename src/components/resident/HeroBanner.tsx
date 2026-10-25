"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ResidentOffer } from "@/lib/offers/types";

const ROTATE_MS = 5000;
const BACKGROUNDS = ["from-navy to-[#2b5182]", "from-amber to-[#f7c26b]", "from-[#2b5182] to-navy"];

/**
 * Rotating hero at the top of the feed, swipeable, one slide per highlighted benefit.
 * shortcut: built from the hottest offers; switch to admin-managed banners in part 5 (content screen).
 */
export function HeroBanner({ offers }: { offers: ResidentOffer[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  /** Scrolls the banner (only it, never the page) to slide i. In RTL, scrollLeft runs from 0 to negative. */
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollTo({ left: (rtl ? -1 : 1) * i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (offers.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go((index + 1) % offers.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [index, offers.length]);

  /** Tracks which slide is showing when the user swipes. */
  function onScroll() {
    const el = track.current;
    if (!el) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  if (offers.length === 0) return null;
  return (
    <section aria-label="הטבות מובילות" aria-roledescription="carousel" className="flex flex-col gap-2">
      <div ref={track} onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto">
        {offers.map((o, i) => (
          <div key={o.businessId} className="w-full shrink-0 snap-start px-4" aria-roledescription="slide" aria-label={`${i + 1} מתוך ${offers.length}`}>
            <Link
              href={`/app/b/${o.businessId}`}
              className={`flex min-h-40 flex-col justify-between gap-3 rounded-3xl bg-gradient-to-bl p-5 shadow-lift ${BACKGROUNDS[i % BACKGROUNDS.length]} ${i % 3 === 1 ? "text-navy" : "text-cream"}`}
            >
              <span className="w-fit rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">🔥 הכי מבוקש בבניינים</span>
              <div>
                <p className="text-sm opacity-80">{o.businessName}</p>
                <p className="text-2xl leading-tight font-bold">{o.title}</p>
              </div>
              <span className="inline-flex items-center gap-1 font-bold">לפרטים <ChevronLeft aria-hidden className="size-4" /></span>
            </Link>
          </div>
        ))}
      </div>
      {offers.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {offers.map((o, i) => (
            <button
              key={o.businessId}
              type="button"
              onClick={() => go(i)}
              aria-label={`הטבה ${i + 1}`}
              aria-current={i === index}
              className="grid size-6 place-items-center"
            >
              <span className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-navy" : "w-2 bg-navy/25"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
