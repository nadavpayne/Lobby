"use client";

import { SupportContent } from "@/components/support/SupportContent";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { useResident } from "../ResidentGate";

/** /app/help — help & support inside the resident app, with the resident's email and role already in the form. */
export default function ResidentHelpScreen() {
  const { token, building } = useResident();
  const { session } = useSupabaseSession();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">עזרה ותמיכה</h1>
      <SupportContent
        token={token}
        prefill={{ email: session?.user.email, role: building.role === "committee" ? "committee" : "resident" }}
      />
    </div>
  );
}
