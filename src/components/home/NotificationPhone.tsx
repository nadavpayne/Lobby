"use client";

import { useEffect, useState } from "react";

/** Sample offers the illustration "texts" to the resident (not live data). */
const MESSAGES = [
  { business: "יוסף דגים", text: "קיבלת 10% הנחה ביוסף דגים ליד הבית שלך, בוא תקנה דגים לשבת! 🐟" },
  { business: "קפה השכונה", text: "10% הנחה על הקפה של הבוקר, 2 דקות הליכה מהבניין ☕" },
  { business: "מאפיית הרצל", text: "חלות חמות יצאו עכשיו מהתנור, 10% הנחה לדיירי הבניין 🥖" },
  { business: "פרחי השכונה", text: "זר לשבת ב-10% הנחה, ממש מתחת לבית 💐" },
] as const;

const VISIBLE = 3;
const INTERVAL_MS = 2800;

/** Number of notifications that have "arrived" so far; ticks forever unless the user prefers reduced motion. */
function useArrivals() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(VISIBLE - 1);
      return;
    }
    const id = setInterval(() => setCount((c) => c + 1), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
  return count;
}

/** Illustration of a resident's lock screen receiving nearby-discount notifications, newest on top. */
export function NotificationPhone() {
  const count = useArrivals();
  // Arrival numbers double as keys, so only the newest notification mounts (and animates in).
  const arrivals = Array.from({ length: VISIBLE }, (_, i) => count - i).filter((n) => n >= 0);

  return (
    <div
      aria-hidden
      className="mx-auto flex h-[30rem] w-64 flex-col overflow-hidden rounded-[2.5rem] border-[10px] border-navy bg-gradient-to-b from-navy-deep via-navy to-[#2a3f6e] p-3 shadow-xl"
    >
      <div className="pt-6 pb-5 text-center text-white">
        <p className="text-sm text-white/70">יום שישי, בוקר</p>
        <p dir="ltr" className="font-brand text-5xl font-bold">9:41</p>
      </div>
      <ul className="flex flex-col gap-2">
        {arrivals.map((n) => {
          const msg = MESSAGES[n % MESSAGES.length];
          return (
            <li key={n} className="animate-notify-in rounded-2xl bg-white/95 p-3 shadow-lg">
              {/* Larger type on mobile, where the hero shrinks the whole phone. */}
              <div className="flex items-center gap-2 text-xs max-md:text-sm">
                <span className="grid size-5 place-items-center rounded-md bg-amber text-[0.65rem] font-bold text-navy">L</span>
                <span className="font-bold">לובי · {msg.business}</span>
                <span className="ms-auto text-navy/50">עכשיו</span>
              </div>
              <p className="mt-1.5 text-sm leading-snug max-md:text-lg">{msg.text}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
