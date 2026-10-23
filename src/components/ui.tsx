import type { ReactNode } from "react";

/** Full-width primary action (amber), 56px tall. */
export const primaryButton =
  "flex min-h-14 w-full items-center justify-center rounded-xl bg-amber px-4 text-xl font-bold text-navy disabled:opacity-50";

/** Full-width secondary action (navy outline), 56px tall. */
export const secondaryButton =
  "flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-navy px-4 text-xl font-bold text-navy disabled:opacity-50";

/** One "label: value" line in a details card. */
export function DetailRow({ label, children, strong = false }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-2xl font-bold" : "text-lg"}`}>
      <span className={strong ? "" : "text-navy/70"}>{label}</span>
      <span className="text-end">{children}</span>
    </div>
  );
}
