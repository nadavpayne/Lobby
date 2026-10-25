import type { ReactNode } from "react";

/** Friendly "nothing here yet" block: round tinted icon, title, text and an optional action. */
export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-10 text-center shadow-soft">
      <span aria-hidden className="grid size-16 place-items-center rounded-full bg-peach text-navy [&>svg]:size-8">{icon}</span>
      <h2 className="text-xl font-bold">{title}</h2>
      {children && <p className="max-w-sm text-navy/70">{children}</p>}
      {action}
    </div>
  );
}
