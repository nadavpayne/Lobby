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
    <div className={`flex flex-col gap-1 rounded-3xl p-4 shadow-soft ${TINT_CLASS[tint]}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        {icon && <span aria-hidden className="[&>svg]:size-4">{icon}</span>}
        {label}
      </div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      {hint && <div className="text-sm opacity-75">{hint}</div>}
    </div>
  );
}
