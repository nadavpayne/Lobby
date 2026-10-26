import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/** A titled, horizontally swiping row (scroll-snap). Scrolls right-to-left naturally in RTL. */
export function Carousel({ title, moreHref, moreLabel = "הכל", children }: { title: string; moreHref?: string; moreLabel?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {moreHref && (
          <Link href={moreHref} className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-navy/70">
            {moreLabel} <ChevronLeft aria-hidden className="size-4" />
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2">{children}</div>
    </section>
  );
}
