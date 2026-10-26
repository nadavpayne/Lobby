"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteAccountFlow } from "@/components/account/DeleteAccountFlow";
import { AppHeader } from "@/components/AppHeader";
import { Loading } from "@/components/ui";
import { useSupabaseSession } from "@/lib/supabase/useSession";

/** /account/delete — delete my account (residents, committee members, business owners), in the app or on the site. */
export default function DeleteAccountPage() {
  const { supabase, session } = useSupabaseSession();
  // Keep the first token: the flow signs out at the end and must still show its "deleted" screen.
  const [token, setToken] = useState<string | null>(null);
  if (session && !token) setToken(session.access_token);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold">מחיקת חשבון</h1>
        {session === undefined && !token && <Loading />}
        {session === null && !token && (
          <p className="rounded-2xl bg-white p-5 text-lg">
            כדי למחוק חשבון צריך להיות מחוברים. <Link href="/start" className="font-bold underline">כניסה לחשבון</Link>, ואז חוזרים לכאן מההגדרות.
          </p>
        )}
        {supabase && token && <DeleteAccountFlow supabase={supabase} token={token} />}
      </main>
    </>
  );
}
