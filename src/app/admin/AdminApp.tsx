"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser";
import { AdminLogin } from "./AdminLogin";
import { BusinessList } from "./BusinessList";

/** Admin entry: magic-link sign-in, then the business list. Picks up the session from the magic link URL. */
export function AdminApp() {
  const supabase = getBrowserClient();
  const [session, setSession] = useState<Session | null>(); // undefined while loading

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  if (!supabase) return <p role="alert">Supabase לא מוגדר: מלאו את המפתחות ב-.env.local.</p>;
  if (session === undefined) return <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;
  if (!session) return <AdminLogin supabase={supabase} />;
  return <BusinessList token={session.access_token} email={session.user.email ?? ""} onSignOut={() => supabase.auth.signOut()} />;
}
