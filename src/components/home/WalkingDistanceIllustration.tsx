"use client";

import { Footprints } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui";
import { BADGES, onRing, RINGS } from "./walkingDistance";

const LABEL = "איור: הבניין שלכם במרכז, ומסביבו בתי קפה, מאפיות, מספרות ובתי מרקחת במרחק 2, 5 ו-10 דקות הליכה";
// Ring fills fade outward (navy at this opacity), so the center reads as "home".
const RING_FILL = [0.1, 0.06, 0.035];

/**
 * "במרחק הליכה": the Lobby house in the middle, walking-time rings around it, category badges on the rings.
 * Categories only, never real businesses, so it stays true at any size of the club. Plays once when scrolled into
 * view (rings outward, then badges), then badges drift slowly; with reduced motion it is simply the final picture.
 */
export function WalkingDistanceIllustration() {
  const box = useRef<HTMLDivElement>(null);
  // "static" until JS decides: without JS or with reduced motion the final picture shows as is.
  const [phase, setPhase] = useState<"static" | "armed" | "play">("static");

  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setPhase("play");
        seen.disconnect();
      } else setPhase((p) => (p === "static" ? "armed" : p)); // off-screen: hide, ready to play on arrival
    }, { threshold: 0.35 });
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  return (
    <div ref={box} role="img" aria-label={LABEL} data-phase={phase} className="walking-distance @container relative mx-auto aspect-square w-full max-w-md">
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full overflow-visible">
        {[...RINGS].reverse().map((ring, i) => {
          const index = RINGS.length - 1 - i;
          return (
            <circle
              key={ring.minutes}
              cx="50" cy="50" r={ring.radius}
              fill="var(--color-navy)" fillOpacity={RING_FILL[index]}
              stroke="var(--color-navy)" strokeOpacity={0.18} strokeWidth="0.35" strokeDasharray="1.2 1.6"
              className="wd-ring" style={{ animationDelay: `${index * 160}ms` }}
            />
          );
        })}
      </svg>

      <div aria-hidden className="wd-ring absolute top-1/2 left-1/2 grid size-[24%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-navy shadow-lift">
        <Logo tone="dark" className="size-[62%]" />
      </div>

      {RINGS.map((ring, i) => {
        const at = onRing(ring.radius, 90);
        return (
          <span
            key={ring.minutes}
            aria-hidden
            className="wd-ring absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-hairline bg-white px-2.5 py-0.5 text-sm font-bold whitespace-nowrap text-navy shadow-soft @max-[380px]:px-3 @max-[380px]:text-base"
            style={{ left: `${at.left}%`, top: `${at.top}%`, animationDelay: `${i * 160 + 120}ms` }}
          >
            {i === 0 && <Footprints className="size-4 text-amber" />}
            {ring.minutes} דק׳
          </span>
        );
      })}

      {BADGES.map((b, i) => {
        const at = onRing(RINGS[b.ring].radius, b.angle);
        return (
          <span
            key={b.id}
            aria-hidden
            className={`absolute size-[12%] -translate-x-1/2 -translate-y-1/2 ${b.compact ? "" : "@max-[380px]:hidden"}`}
            style={{ left: `${at.left}%`, top: `${at.top}%` }}
          >
            <span className="wd-badge grid size-full place-items-center rounded-full bg-white text-amber shadow-soft" style={{ animationDelay: `${500 + i * 70}ms, ${1500 + i * 400}ms` }}>
              <b.icon className="size-[52%]" strokeWidth={2.2} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
