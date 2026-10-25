import type { ReactNode } from "react";
import { Logo } from "@/components/ui";
import { BottomNav } from "./BottomNav";
import type { NavItem } from "./types";

interface Props {
  nav: NavItem[];
  /** Shown as "הבניין שלי: …" once known. */
  buildingName?: string;
  children: ReactNode;
}

/** Resident app layout: navy header with the logo and my building, content column, bottom tab bar. */
export function ResidentShell({ nav, buildingName, children }: Props) {
  return (
    <>
      <header className="bg-navy px-4 pt-safe pb-3 text-cream">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Logo className="size-10" />
          <div className="flex min-w-0 flex-col leading-tight">
            <span dir="ltr" className="text-start font-brand text-lg text-white">Lobby</span>
            {buildingName && <span className="truncate text-sm text-cream/80">הבניין שלי: {buildingName}</span>}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-28">{children}</main>
      <BottomNav items={nav} />
    </>
  );
}
