"use client";

import { Store } from "lucide-react";
import type { ReactNode } from "react";
import { RoleGate, useAccount } from "@/components/auth/RoleGate";
import { CrmShell } from "@/components/shell/CrmShell";
import type { NavItem } from "@/components/shell/types";

// Grows with part 5 (overview, buildings, residents, redemptions, billing, content).
const NAV: NavItem[] = [{ href: "/admin", label: "עסקים", icon: Store }];

/** The CRM frame once an admin is signed in. */
function Frame({ children }: { children: ReactNode }) {
  const { email, signOut } = useAccount();
  return <CrmShell appName="ניהול" nav={NAV} account={email} onSignOut={signOut}>{children}</CrmShell>;
}

/** Admin app: admin accounts only, inside the shared CRM shell. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate app="/admin" loginTitle="כניסת מנהל">
      <Frame>{children}</Frame>
    </RoleGate>
  );
}
