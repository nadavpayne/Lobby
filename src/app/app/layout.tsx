import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { ResidentGate } from "./ResidentGate";

export const metadata: Metadata = { title: "לובי — ההטבות שלי", robots: { index: false, follow: false } };

/** Resident app shell: header, the gate (login / membership), screens, bottom tab bar. */
export default function ResidentLayout({ children }: LayoutProps<"/app">) {
  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-28">
        <ResidentGate>{children}</ResidentGate>
      </main>
    </>
  );
}
