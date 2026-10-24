"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { getBrowserClient } from "@/lib/supabase/browser";
import { BusinessList } from "./BusinessList";

/** Admin entry: email-code sign-in (existing admin account only), then the business list. */
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
  if (!session) return <EmailCodeLogin supabase={supabase} shouldCreateUser={false} title="כניסת מנהל" />;
  return <BusinessList token={session.access_token} email={session.user.email ?? ""} onSignOut={() => supabase.auth.signOut()} />;
}
