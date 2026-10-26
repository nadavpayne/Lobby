"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { BusinessLogo } from "@/components/resident/BusinessCover";
import { businessLinks, otherApps, type MenuLink } from "@/lib/auth/accountMenu";
import type { HomeAccount } from "@/lib/auth/useHomeAccount";

const linkClass = "flex min-h-11 items-center px-4 font-bold text-navy hover:bg-navy/5";
const headingClass = "px-4 pt-3 pb-1 text-xs font-bold text-muted";

/** A titled group of menu links. */
function Section({ title, links }: { title: string; links: MenuLink[] }) {
  if (!links.length) return null;
  return (
    <li className="border-t border-hairline">
      <p className={headingClass}>{title}</p>
      <ul>
        {links.map((l) => (
          <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
        ))}
      </ul>
    </li>
  );
}

/** The menu for a signed-in account: who you are, your business shortcuts, your other apps, sign out. */
export function AccountMenu({ account }: { account: HomeAccount }) {
  const name = account.business?.name ?? account.email.split("@")[0];
  return (
    <>
      <li className="flex items-center gap-3 px-4 py-3">
        <BusinessLogo name={name} logoUrl={account.business?.logoUrl ?? null} className="size-12 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-bold text-navy">{name}</p>
          <p dir="ltr" className="truncate text-end text-sm text-muted">{account.email}</p>
        </div>
      </li>
      <Section title="העסק שלי" links={businessLinks(account.roles)} />
      <Section title="עוד" links={otherApps(account.roles)} />
      <li className="border-t border-hairline">
        <button type="button" onClick={account.signOut} className={`${linkClass} w-full gap-2 text-red-700`}>
          <LogOut aria-hidden className="size-4" />
          יציאה מהחשבון
        </button>
      </li>
    </>
  );
}
