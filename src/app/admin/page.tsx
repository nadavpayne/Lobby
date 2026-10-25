"use client";

import { useAccount } from "@/components/auth/RoleGate";
import { BusinessList } from "./BusinessList";

/** /admin — businesses, pending first, with activate / pause. */
export default function AdminPage() {
  const { token } = useAccount();
  return <BusinessList token={token} />;
}
