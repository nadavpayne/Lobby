"use client";

import { LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import { RoleGate, useAccount } from "@/components/auth/RoleGate";
import { CrmShell } from "@/components/shell/CrmShell";
import type { NavItem } from "@/components/shell/types";

// Grows with part 4 (scan, customers, offers, billing, profile & team).
const NAV: NavItem[] = [{ href: "/biz", label: "לוח בקרה", icon: LayoutDashboard }];

/** The CRM frame once a business owner is signed in. */
function Frame({ children }: { children: ReactNode }) {
  const { email, signOut } = useAccount();
  return <CrmShell appName="העסק שלי" nav={NAV} account={email} onSignOut={signOut}>{children}</CrmShell>;
}

/** Business app: business-owner accounts only, inside the shared CRM shell. */
export function BizShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate app="/biz" loginTitle="כניסה לבעלי עסקים" allowSignUp>
      <Frame>{children}</Frame>
    </RoleGate>
  );
}
