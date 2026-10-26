"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isCurrent, type NavItem } from "./types";

/** Fixed bottom tab bar above the home indicator. The first item is the app's root. */
export function BottomNav({ items, className = "" }: { items: NavItem[]; className?: string }) {
  const path = usePathname();
  return (
    <nav aria-label="ניווט באפליקציה" className={`fixed inset-x-0 bottom-0 z-20 border-t border-navy/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden ${className}`}>
      {/* More than 5 items (admin) scroll sideways instead of squeezing. */}
      <ul className={`mx-auto flex max-w-lg ${items.length > 5 ? "no-scrollbar overflow-x-auto" : ""}`}>
        {items.map(({ href, label, icon: Icon }) => {
          const current = isCurrent(path, href, items[0].href);
          return (
            <li key={href} className={`flex-1 ${items.length > 5 ? "min-w-[4.5rem]" : ""}`}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs transition active:scale-95 ${current ? "font-bold text-navy" : "text-muted"}`}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full transition ${current ? "bg-peach" : ""}`}>
                  <Icon aria-hidden className="size-5" strokeWidth={current ? 2.5 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
