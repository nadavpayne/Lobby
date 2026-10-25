"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui";
import { isCurrent, type NavItem } from "./types";

/** CRM side navigation for desktop (hidden below md): logo, app name, nav links. */
export function SideNav({ items, appName }: { items: NavItem[]; appName: string }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 bg-navy p-4 text-cream md:flex">
      <div className="flex items-center gap-2 pt-2">
        <Logo className="size-10" />
        <div dir="ltr" className="flex flex-col text-start leading-tight">
          <span className="font-brand text-xl text-white">Lobby</span>
          <span dir="rtl" className="text-sm text-cream/70">{appName}</span>
        </div>
      </div>
      <nav aria-label="ניווט">
        <ul className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon }) => {
            const current = isCurrent(path, href, items[0].href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 font-medium transition ${current ? "bg-amber text-navy" : "text-cream/80 hover:bg-white/10"}`}
                >
                  <Icon aria-hidden className="size-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
