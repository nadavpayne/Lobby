import type { ReactNode } from "react";

/** Shared look for text inputs, selects and textareas (48px tall: comfortable touch target). */
export const inputClass =
  "min-h-12 w-full rounded-xl border border-navy/25 bg-white px-3 text-lg outline-none focus:border-navy focus:ring-2 focus:ring-amber aria-invalid:border-red-700";

/** Labeled form control with an optional hint and an error message. */
export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-medium">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-sm text-red-700">{error}</span>
      ) : (
        hint && <span className="text-sm text-navy/70">{hint}</span>
      )}
    </label>
  );
}
