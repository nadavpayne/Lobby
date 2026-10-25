"use client";

import { LayoutDashboard, Megaphone, ReceiptText, ScanLine, Store, Users } from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { RoleGate, useAccount } from "@/components/auth/RoleGate";
import { CrmShell } from "@/components/shell/CrmShell";
import type { NavItem } from "@/components/shell/types";
import { fetchMyBusiness, type MyBusiness } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import { STATUS_NOTICE } from "@/lib/businesses/statusNotice";

const NAV: NavItem[] = [
  { href: "/biz", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/biz/scan", label: "מימוש", icon: ScanLine },
  { href: "/biz/customers", label: "לקוחות", icon: Users },
  { href: "/biz/offers", label: "הטבות", icon: Megaphone },
  { href: "/biz/billing", label: "חיובים", icon: ReceiptText },
  { href: "/biz/profile", label: "העסק", icon: Store },
];

interface Biz {
  token: string;
  business: MyBusiness;
  signOut: () => void;
}

const BizContext = createContext<Biz | null>(null);

/** The signed-in owner's session and business (only inside BizShell). */
export function useBiz(): Biz {
  const biz = useContext(BizContext);
  if (!biz) throw new Error("useBiz outside BizShell");
  return biz;
}

/** The CRM frame once a business owner is signed in: loads the business, shows its status notice. */
function Frame({ children }: { children: ReactNode }) {
  const { token, signOut } = useAccount();
  const [business, setBusiness] = useState<MyBusiness>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchMyBusiness(token).then((res) => {
      if (!live) return;
      if (isApiError(res)) setError(res.error);
      else setBusiness(res);
    });
    return () => {
      live = false;
    };
  }, [token]);

  return (
    <CrmShell appName="העסק שלי" nav={NAV} account={business?.name} onSignOut={signOut}>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {!business && !error && <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>}
      {business && (
        <BizContext.Provider value={{ token, business, signOut }}>
          {business.status !== "active" && <p className="mb-4 rounded-2xl bg-peach p-4">{STATUS_NOTICE[business.status]}</p>}
          {children}
        </BizContext.Provider>
      )}
    </CrmShell>
  );
}

/** Business app: business-owner accounts only, inside the shared CRM shell. */
export function BizShell({ children }: { children: ReactNode }) {
  return (
    <RoleGate app="/biz" loginTitle="כניסה לבעלי עסקים" allowSignUp>
      <Frame>{children}</Frame>
    </RoleGate>
  );
}
