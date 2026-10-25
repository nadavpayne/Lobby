"use client";

import { useState } from "react";

export interface Bar {
  label: string;
  value: number;
  /** Shown on hover/focus, e.g. "26.10 · 7 מימושים". */
  tooltip: string;
  /** Text under the bar; leave empty to skip (label every few bars, not all). */
  tick?: string;
}

interface Props {
  bars: Bar[];
  /** Screen-reader summary of what the chart shows. */
  title: string;
  /** Highlight the last bar in orange (e.g. today). */
  highlightLast?: boolean;
}

/**
 * Single-series column chart in brand colors: navy bars, 4px rounded tops on the baseline, 2px gaps,
 * a hover/focus tooltip per bar and a hidden table for screen readers. Bars run right-to-left in RTL.
 */
export function BarChart({ bars, title, highlightLast = false }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative h-44 border-b border-navy/15" role="img" aria-label={title}>
        <div className="absolute inset-0 flex items-end gap-0.5" onMouseLeave={() => setActive(null)}>
          {bars.map((b, i) => {
            const last = highlightLast && i === bars.length - 1;
            return (
              <div
                key={b.label}
                tabIndex={0}
                aria-label={b.tooltip}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="group relative flex h-full flex-1 cursor-default items-end outline-none"
              >
                <div
                  className={`w-full rounded-t-[4px] transition-colors ${last ? "bg-amber" : "bg-navy"} ${active === i ? "opacity-100" : active === null ? "opacity-90" : "opacity-50"} group-focus-visible:ring-2 group-focus-visible:ring-amber`}
                  style={{ height: `${b.value === 0 ? 0 : Math.max(3, (b.value / max) * 100)}%` }}
                />
                {active === i && (
                  <div className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-xs text-cream shadow-lift rtl:translate-x-1/2">
                    {b.tooltip}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-0.5 text-xs text-navy/60" aria-hidden>
        {bars.map((b) => <span key={b.label} className="flex-1 text-center whitespace-nowrap">{b.tick ?? ""}</span>)}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>{bars.map((b) => <tr key={b.label}><th scope="row">{b.label}</th><td>{b.value}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}
