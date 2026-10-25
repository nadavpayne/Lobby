import { LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import type { NavItem } from "./types";

interface Props {
  appName: string;
  nav: NavItem[];
  /** Who is signed in (business name / email), shown in the top bar. */
  account?: string;
  onSignOut?: () => void;
  /** Extra top-bar content, e.g. global search in the admin app. */
  topBar?: ReactNode;
  children: ReactNode;
}

/** Shared CRM layout for /biz and /admin: side nav on desktop, bottom nav on phones, top bar, content. */
export function CrmShell({ appName, nav, account, onSignOut, topBar, children }: Props) {
  return (
    <div className="flex min-h-dvh">
      <SideNav items={nav} appName={appName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-navy/10 bg-cream/90 px-4 pt-safe pb-3 backdrop-blur md:px-8 print:hidden">
          <Link href="/" aria-label="לובי, לדף הבית" className="shrink-0 md:hidden">
            <Logo className="size-8" />
          </Link>
          <div className="min-w-0 flex-1">{topBar}</div>
          {account && <span className="hidden truncate text-sm text-navy/70 sm:block">{account}</span>}
          {onSignOut && (
            <button type="button" onClick={onSignOut} aria-label="יציאה" className="grid size-11 place-items-center rounded-full hover:bg-navy/5">
              <LogOut aria-hidden className="size-5 rtl:-scale-x-100" />
            </button>
          )}
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:px-8 md:pb-10">{children}</main>
      </div>
      <BottomNav items={nav} className="md:hidden" />
    </div>
  );
}
