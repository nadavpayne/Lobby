"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  ["/app", "🎁", "הטבות"],
  ["/app/codes", "🎟️", "הקודים שלי"],
  ["/app/building", "🏢", "הבניין"],
] as const;

/** Bottom tab bar of the resident app; sits above the home indicator. */
export function TabBar() {
  const path = usePathname();
  return (
    <nav aria-label="ניווט באפליקציה" className="fixed inset-x-0 bottom-0 z-20 border-t border-navy/10 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-lg grid-cols-3">
        {TABS.map(([href, icon, label]) => {
          const current = path === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-sm ${current ? "font-bold text-navy" : "text-navy/60"}`}
              >
                <span aria-hidden className="text-xl">{icon}</span>
                {label}
                <span aria-hidden className={`h-1 w-8 rounded-full ${current ? "bg-amber" : "bg-transparent"}`} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
