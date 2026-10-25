import type { Metadata } from "next";
import { AdminShell } from "./AdminShell";

export const metadata: Metadata = { title: "ניהול | לובי", robots: { index: false, follow: false } };

/** /admin/* — Lobby operator CRM (admin role only; enforced again by every /api/admin route). */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
