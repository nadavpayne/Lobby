"use client";

import { useEffect, useRef, useState } from "react";
import { native } from "@/lib/native";

const TRIGGER = 70; // px of pull that refreshes

/**
 * Pull down at the top of a list to refresh it (iOS app only: in Safari the browser's own pull-to-reload already
 * exists). Shows the house-roof spinner while pulling and refreshing.
 */
export function PullToRefresh({ onRefresh }: { onRefresh: () => Promise<unknown> | void }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef<number | null>(null);
  const distance = useRef(0);
  const refresh = useRef(onRefresh);
  useEffect(() => {
    refresh.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!native.isApp) return;
    const down = (e: TouchEvent) => { start.current = window.scrollY <= 0 ? e.touches[0].clientY : null; };
    const move = (e: TouchEvent) => {
      if (start.current === null) return;
      distance.current = Math.max(0, Math.min(110, e.touches[0].clientY - start.current));
      setPull(distance.current);
    };
    const up = () => {
      if (start.current === null) return;
      start.current = null;
      if (distance.current >= TRIGGER) {
        setBusy(true);
        Promise.resolve(refresh.current()).finally(() => setBusy(false));
      }
      distance.current = 0;
      setPull(0);
    };
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, []);

  if (!busy && pull === 0) return null;
  return (
    <div role="status" aria-label={busy ? "מרעננים" : "משכו לרענון"} className="flex justify-center" style={{ height: busy ? 44 : pull * 0.6 }}>
      <span className={`size-8 rounded-full border-4 border-navy/15 border-t-amber ${busy ? "animate-spin" : ""}`} style={busy ? undefined : { transform: `rotate(${pull * 4}deg)` }} />
    </div>
  );
}
