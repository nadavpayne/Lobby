"use client";

import { useMemo } from "react";
import { RegisterFlow } from "@/components/register/RegisterFlow";
import { accountRegister } from "@/lib/api/register";
import { useBiz } from "../BizShell";

/** /biz/scan — the owner works the register: same flow as cashiers and the staff terminal. */
export default function ScanScreenPage() {
  const { token, business, signOut } = useBiz();
  const api = useMemo(() => accountRegister(token), [token]);
  return (
    <div className="mx-auto max-w-md">
      <RegisterFlow api={api} businessName={business.name} station="בעל העסק" onUnauthorized={signOut} />
    </div>
  );
}
