"use client";

import { Building2, LayoutDashboard, LifeBuoy, MapPinned, Megaphone, MessageSquareWarning, ReceiptText, Store, Ticket, Users } from "lucide-react";
import type { ReactNode } from "react";
import { RoleGate, useAccount } from "@/components/auth/RoleGate";
import { CrmShell } from "@/components/shell/CrmShell";
import type { NavItem } from "@/components/shell/types";
import { GlobalSearch } from "./GlobalSearch";

const NAV: NavItem[] = [
  { href: "/admin", label: "סקירה", icon: LayoutDashboard },
  { href: "/admin/buildings", label: "בניינים", icon: Building2 },
  { href: "/admin/businesses", label: "עסקים", icon: Store },
  { href: "/admin/map", label: "מפה", icon: MapPinned },
  { href: "/admin/residents", label: "דיירים", icon: Users },
  { href: "/admin/redemptions", label: "מימושים", icon: Ticket },
  { href: "/admin/disputes", label: "דיווחים", icon: MessageSquareWarning },
  { href: "/admin/billing", label: "חיובים", icon: ReceiptText },
  { href: "/admin/content", label: "תוכן", icon: Megaphone },
  { href: "/admin/support", label: "תמיכה", icon: LifeBuoy },
];

/** The CRM frame once an admin is signed in, with global search in the top bar. */
function Frame({ children }: { children: ReactNode }) {
  const { token, email, signOut } = useAccount();
  return (
    <CrmShell appName="ניהול לובי" nav={NAV} account={email} onSignOut={signOut} topBar={<GlobalSearch token={token} />}>
      {children}
    </CrmShell>
  );
}

/** Admin app: admin accounts only, inside the shared CRM shell. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate app="/admin" loginTitle="כניסת מנהל">
      <Frame>{children}</Frame>
    </RoleGate>
  );
}
