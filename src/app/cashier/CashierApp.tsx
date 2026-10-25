"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGate, useAccount } from "@/components/auth/RoleGate";
import { RegisterFlow } from "@/components/register/RegisterFlow";
import { fetchMyBusiness, type MyBusiness } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import { accountRegister } from "@/lib/api/register";

/** The register for a signed-in cashier: no reports, no settings, just scan → bill → approve. */
function Register() {
  const { token, email, signOut } = useAccount();
  const api = useMemo(() => accountRegister(token), [token]);
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
    <main className="mx-auto w-full max-w-md flex-1 px-3 pt-safe pb-4">
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      {business && <RegisterFlow api={api} businessName={business.name} station={email.split("@")[0]} onSignOut={signOut} onUnauthorized={signOut} />}
    </main>
  );
}

/** Cashier app: cashier accounts only (created by the business owner; no sign-up here). */
export function CashierApp() {
  return (
    <RoleGate app="/cashier" loginTitle="כניסה לקופה">
      <Register />
    </RoleGate>
  );
}
