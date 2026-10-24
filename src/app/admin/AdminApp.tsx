"use client";

import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { useSupabaseSession } from "@/lib/supabase/useSession";
import { BusinessList } from "./BusinessList";

/** Admin entry: email-code sign-in (existing admin account only), then the business list. */
export function AdminApp() {
  const { supabase, session } = useSupabaseSession();

  if (!supabase) return <p role="alert">Supabase לא מוגדר: מלאו את המפתחות ב-.env.local.</p>;
  if (session === undefined) return <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;
  if (!session) return <EmailCodeLogin supabase={supabase} shouldCreateUser={false} title="כניסת מנהל" />;
  return <BusinessList token={session.access_token} email={session.user.email ?? ""} onSignOut={() => supabase.auth.signOut()} />;
}
