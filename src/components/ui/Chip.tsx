import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  selected?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

/** Toggle chip (filters, categories). Selected = navy fill. */
export function Chip({ selected = false, icon, children, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-navy/15 bg-white px-4 font-medium transition active:scale-95 aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-cream ${className}`}
      {...rest}
    >
      {icon && <span aria-hidden className="[&>svg]:size-5">{icon}</span>}
      {children}
    </button>
  );
}

/** Horizontally scrolling row of chips that bleeds to the screen edges (inside a px-4 container). */
export function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
      {children}
    </div>
  );
}
