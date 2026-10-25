"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { HeroSlide } from "@/lib/offers/feedSections";

const ROTATE_MS = 5000;
const BACKGROUNDS = ["from-navy to-[#2b5182]", "from-amber to-[#f7c26b]", "from-[#2b5182] to-navy"];

/** One slide's card: image (if any) behind the text, links when it has a target. */
function SlideCard({ slide: s, i }: { slide: HeroSlide; i: number }) {
  const dark = !s.imageUrl && i % 3 === 1;
  const body: ReactNode = (
    <>
      {s.imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- operator-set remote banner image */}
          <img src={s.imageUrl} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
          <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy/85 to-navy/20" />
        </>
      )}
      <span className="w-fit rounded-full bg-white/20 px-3 py-0.5 text-sm font-medium">{s.badge}</span>
      <div>
        {s.kicker && <p className="text-sm opacity-80">{s.kicker}</p>}
        <p className="text-2xl leading-tight font-bold">{s.title}</p>
      </div>
      {s.href && <span className="inline-flex items-center gap-1 font-bold">לפרטים <ChevronLeft aria-hidden className="size-4" /></span>}
    </>
  );
  const className = `relative isolate flex min-h-40 flex-col justify-between gap-3 overflow-hidden rounded-3xl p-5 shadow-lift ${s.imageUrl ? "text-cream" : `bg-gradient-to-bl ${BACKGROUNDS[i % BACKGROUNDS.length]} ${dark ? "text-navy" : "text-cream"}`}`;
  return s.href ? <Link href={s.href} className={className}>{body}</Link> : <div className={className}>{body}</div>;
}

/** Rotating, swipeable hero at the top of the feed (operator banners or the hottest benefits). */
export function HeroBanner({ slides }: { slides: HeroSlide[] }) {
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
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => go((index + 1) % slides.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [index, slides.length]);

  /** Tracks which slide is showing when the user swipes. */
  function onScroll() {
    const el = track.current;
    if (!el) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  if (slides.length === 0) return null;
  return (
    <section aria-label="הטבות מובילות" aria-roledescription="carousel" className="flex flex-col gap-2">
      <div ref={track} onScroll={onScroll} className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto">
        {slides.map((s, i) => (
          <div key={s.key} className="w-full shrink-0 snap-start px-4" aria-roledescription="slide" aria-label={`${i + 1} מתוך ${slides.length}`}>
            <SlideCard slide={s} i={i} />
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button key={s.key} type="button" onClick={() => go(i)} aria-label={`שקופית ${i + 1}`} aria-current={i === index} className="grid size-6 place-items-center">
              <span className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-navy" : "w-2 bg-navy/25"}`} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
