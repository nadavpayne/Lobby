import Link from "next/link";
import type { ReactNode } from "react";
import { Lockup } from "./Lockup";

/** Navy top bar: brand lockup (links home) and optional actions on the end side; extends under the notch. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-navy px-4 pt-safe pb-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" className="min-h-11 content-center">
          <Lockup />
        </Link>
        {children}
      </div>
    </header>
  );
}
