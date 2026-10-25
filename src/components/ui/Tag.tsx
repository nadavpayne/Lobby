import type { ReactNode } from "react";
import { TINT_CLASS, type Tint } from "./tints";

/** Small rounded label ("מסתיים ב-31.12", "שולם", "VIP"). */
export function Tag({ tint = "sky", icon, children }: { tint?: Tint; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium [&_svg]:size-3.5 ${TINT_CLASS[tint]}`}>
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}
