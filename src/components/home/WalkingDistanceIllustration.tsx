"use client";

import { Footprints } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui";
import { BADGES, onRing, RINGS } from "./walkingDistance";

const LABEL = "איור: הבניין שלכם במרכז, ומסביבו בתי קפה, מאפיות, מספרות ובתי מרקחת במרחק 2, 5 ו-10 דקות הליכה";
// Ring fills fade outward (navy at this opacity), so the center reads as "home".
const RING_FILL = [0.1, 0.06, 0.035];
// The opening: each ring opens this long after the previous one, then its label, then its badges one by one.
const RING_STEP = 800;
const opensAt = (ring: number) => ring * RING_STEP;
// After the opening, one slow amber wave grows from the house (r 12 → 48, linearly) and lights each ring's
// businesses as it reaches them.
const WAVE_START = 2800;
const WAVE_MS = 4500;
const WAVE_FROM = 12;
const WAVE_SCALE = 4;
const reachedAt = (radius: number) => WAVE_START + ((radius - WAVE_FROM) / (WAVE_FROM * WAVE_SCALE - WAVE_FROM)) * WAVE_MS;

/**
 * "במרחק הליכה": the Lobby house in the middle, walking-time rings around it, category badges on the rings.
 * Categories only, never real businesses, so it stays true at any size of the club. When it scrolls into view the
 * rings open one after another (2, then 5, then 10 minutes) with their businesses popping out; then a single wave
 * spreads from the house and lights every business it reaches, with its name. The time labels are buttons that focus
 * their ring (tap again for all). With reduced motion it is the final picture, and the buttons still work.
 */
export function WalkingDistanceIllustration() {
  const box = useRef<HTMLDivElement>(null);
  // "static" until JS decides: without JS or with reduced motion the final picture shows as is.
  const [phase, setPhase] = useState<"static" | "armed" | "play">("static");
  const [active, setActive] = useState<number | null>(null);
  // How many rings the wave has reached. Without the animation everything is lit from the start.
  const [waved, setWaved] = useState(0);
  const reached = phase === "static" ? RINGS.length : waved;

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

  // Light each ring's businesses when the wave reaches it.
  useEffect(() => {
    if (phase !== "play") return;
    const timers = RINGS.map((ring, i) => setTimeout(() => setWaved(i + 1), reachedAt(ring.radius)));
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  /** A tapped label focuses its ring; tapping it again shows all of them. */
  function pick(ring: number) {
    setActive((a) => (a === ring ? null : ring));
  }

  return (
    <div ref={box} role="group" aria-label={LABEL} data-phase={phase} className="walking-distance @container relative mx-auto aspect-square w-full max-w-md">
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full overflow-visible">
        {[...RINGS].reverse().map((ring, i) => {
          const index = RINGS.length - 1 - i;
          const on = active === index;
          return (
            <circle
              key={ring.minutes}
              cx="50" cy="50" r={ring.radius}
              fill="var(--color-navy)" stroke="var(--color-navy)" strokeWidth="0.35" strokeDasharray="1.2 1.6"
              className="wd-ring"
              style={{
                fillOpacity: RING_FILL[index] + (on ? 0.05 : 0),
                strokeOpacity: on ? 0.55 : 0.18,
                transition: "fill-opacity 500ms, stroke-opacity 500ms",
                animationDelay: `${opensAt(index)}ms`,
              }}
            />
          );
        })}
        <circle
          cx="50" cy="50" r={WAVE_FROM} fill="none" stroke="var(--color-amber)" strokeWidth="0.6" className="wd-ripple"
          style={{ animationDuration: `${WAVE_MS}ms`, animationDelay: `${WAVE_START}ms` }}
        />
      </svg>

      <div aria-hidden className="wd-ring absolute top-1/2 left-1/2 grid size-[24%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-navy shadow-lift">
        <Logo tone="dark" className="size-[62%]" />
      </div>

      {RINGS.map((ring, i) => {
        const at = onRing(ring.radius, 90);
        const names = BADGES.filter((b) => b.ring === i).map((b) => b.name).join(", ");
        return (
          <button
            key={ring.minutes}
            type="button"
            onClick={() => pick(i)}
            aria-pressed={active === i}
            aria-label={`${ring.minutes} דקות הליכה: ${names}`}
            className={`wd-ring absolute z-10 flex min-h-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-bold whitespace-nowrap shadow-soft transition-colors @max-[380px]:min-h-8 @max-[380px]:px-3 @max-[380px]:text-base ${
              active === i ? "border-navy bg-navy text-white" : "border-hairline bg-white text-navy hover:border-navy/40"
            }`}
            style={{ left: `${at.left}%`, top: `${at.top}%`, animationDelay: `${opensAt(i) + 250}ms` }}
          >
            {i === 0 && <Footprints aria-hidden className={`size-4 ${active === i ? "text-highlight" : "text-amber"}`} />}
            {ring.minutes} דק׳
          </button>
        );
      })}

      {BADGES.map((b) => {
        const at = onRing(RINGS[b.ring].radius, b.angle);
        const order = BADGES.filter((x) => x.ring === b.ring).indexOf(b);
        const lit = active === null ? b.ring < reached : active === b.ring;
        const dimmed = !lit; // not reached by the wave yet, or another ring is focused: gray and faded
        const upper = at.top < 50; // names sit outward: above the badges in the top half, below in the bottom half
        return (
          <span
            key={b.id}
            aria-hidden
            className={`absolute size-[12%] -translate-x-1/2 -translate-y-1/2 ${b.compact ? "" : "@max-[380px]:hidden"}`}
            style={{ left: `${at.left}%`, top: `${at.top}%` }}
          >
            <span className={`block size-full transition duration-500 ${lit ? "scale-115" : ""} ${dimmed ? "opacity-45 grayscale" : ""}`}>
              <span
                className="wd-badge grid size-full place-items-center rounded-full bg-white text-amber shadow-soft"
                style={{ animationDelay: `${opensAt(b.ring) + 400 + order * 140}ms, ${WAVE_START + order * 500}ms` }}
              >
                <b.icon className="size-[52%]" strokeWidth={2.2} />
              </span>
            </span>
            <span
              className={`pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full bg-navy px-2 py-0.5 text-xs font-bold whitespace-nowrap text-white transition-opacity duration-500 ${
                upper ? "bottom-full mb-1.5" : "top-full mt-1.5"
              } ${lit ? "opacity-100" : "opacity-0"}`}
            >
              {b.name}
            </span>
          </span>
        );
      })}
    </div>
  );
}
