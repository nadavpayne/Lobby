import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

/** Navy top bar (lighter toward the bottom): logo (links home) and optional actions on the end side; extends under the notch. */
export function AppHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="bg-linear-to-b from-navy from-40% to-navy-light px-4 pt-safe pb-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <Link href="/" aria-label="לובי, לדף הבית" className="min-h-11 content-center">
          <Logo className="size-10" tone="dark" />
        </Link>
        {children}
      </div>
    </header>
  );
}
