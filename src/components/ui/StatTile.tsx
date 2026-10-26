import type { ReactNode } from "react";
import { TINT_CLASS, type Tint } from "./tints";

interface Props {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Small line under the value, e.g. "+12% מהחודש שעבר". */
  hint?: ReactNode;
  tint?: Tint;
}

/** Dashboard number tile: icon, label, big value, optional hint. */
export function StatTile({ label, value, icon, hint, tint = "white" }: Props) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 rounded-3xl p-4 shadow-soft ${TINT_CLASS[tint]}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        {icon && <span aria-hidden className="[&>svg]:size-4">{icon}</span>}
        {label}
      </div>
      {/* Smaller and tighter on phones: a two-column grid can't fit "1,870.00₪" at 30px; a longer sum wraps rather than spills. */}
      <div className="text-2xl font-bold tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-3xl sm:tracking-normal">{value}</div>
      {hint && <div className="text-sm opacity-75">{hint}</div>}
    </div>
  );
}
