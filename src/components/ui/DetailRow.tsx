import type { ReactNode } from "react";

/** One "label: value" line in a details card. */
export function DetailRow({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-2xl font-bold" : "text-lg"}`}>
      <span className={strong ? "" : "text-navy/70"}>{label}</span>
      <span className="text-end">{children}</span>
    </div>
  );
}
