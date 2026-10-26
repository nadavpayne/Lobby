"use client";

import { SupportContent } from "@/components/support/SupportContent";
import { useAccount } from "@/components/auth/RoleGate";
import { useBiz } from "../BizShell";

/** /biz/help — help & support inside the business area, with the owner's details already in the form. */
export default function BizHelpScreen() {
  const { token, business } = useBiz();
  const { email } = useAccount();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">עזרה ותמיכה</h1>
      <SupportContent token={token} prefill={{ name: business.name, email: business.email ?? email, role: "business" }} />
    </div>
  );
}
