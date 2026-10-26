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

/** Resident app layout: gradient navy header (same as the home page) with the logo and my building centered, content, tab bar. */
export function ResidentShell({ nav, buildingName, children }: Props) {
  return (
    <>
      <header className="bg-linear-to-b from-navy from-40% to-navy-light px-4 pt-safe pb-3 text-white">
        {/* Logo | centered building | empty column as wide as the logo, so the text sits in the true center. */}
        <div className="mx-auto grid max-w-lg grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
          <Logo className="size-10" tone="dark" />
          {buildingName && <p className="truncate text-center font-medium">הבניין שלי: {buildingName}</p>}
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-28">{children}</main>
      <BottomNav items={nav} />
    </>
  );
}
