"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useHomeAccount } from "@/lib/auth/useHomeAccount";
import { AccountMenu } from "./AccountMenu";

const ITEMS = [
  ["/start", "כניסה"],
  // Residents can't self-register (only via the committee's link), so sign-up means registering a building.
  ["/building/new", "הרשמה לוועד בית"],
  ["/join", "הצטרפות עסקים"],
] as const;

/** Home header menu: a white three-line button; signed out → sign-in / business links, signed in → the account menu. */
export function HomeMenu() {
  const account = useHomeAccount();
  return (
    <div className="flex items-center gap-2">
      {account?.roles.includes("admin") && (
        <Link href="/admin" className="flex min-h-11 items-center rounded-xl bg-amber px-4 font-bold text-navy">ניהול</Link>
      )}
      <details className="group relative z-30">
      <summary aria-label="תפריט" className="grid size-11 cursor-pointer list-none place-items-center rounded-full text-white hover:bg-white/10 [&::-webkit-details-marker]:hidden">
        <Menu className="size-7" aria-hidden />
      </summary>
      <ul className={`absolute end-0 top-full mt-2 overflow-hidden rounded-2xl bg-white py-1 shadow-lift ${account ? "w-72" : "w-48"}`}>
        {account ? (
          <AccountMenu account={account} />
        ) : (
          ITEMS.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="flex min-h-11 items-center px-4 font-bold text-navy hover:bg-navy/5">{label}</Link>
            </li>
          ))
        )}
      </ul>
      </details>
    </div>
  );
}
