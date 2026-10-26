import type { Metadata } from "next";
import { ResidentGate } from "./ResidentGate";

export const metadata: Metadata = { title: "לובי | ההטבות שלי", robots: { index: false, follow: false } };

/** Resident app: the gate (login / membership) opens the resident shell with its tab bar. */
export default function ResidentLayout({ children }: LayoutProps<"/app">) {
  return <ResidentGate>{children}</ResidentGate>;
}
