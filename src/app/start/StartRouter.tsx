"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { buttonClass } from "@/components/ui";
import { useRoles } from "@/lib/auth/useRoles";
import { useSupabaseSession } from "@/lib/supabase/useSession";

/** Sign-in, then a redirect to /app, /biz or /admin; accounts with no role get an explanation. */
export function StartRouter() {
  const router = useRouter();
  const { supabase, session } = useSupabaseSession();
  const { roles, error } = useRoles(supabase, session?.access_token);
  const home = roles?.home;

  useEffect(() => {
    if (home) router.replace(home);
  }, [home, router]);

  const loading = <p className="pt-10 text-center text-lg text-navy/70">טוען…</p>;
  if (!supabase || session === undefined) return loading;
  if (!session) {
    // Creating accounts is allowed so a business owner from /join can sign in the first time;
    // an account with no role only ever sees the message below.
    return <EmailCodeLogin supabase={supabase} shouldCreateUser title="כניסה ללובי" subtitle="דיירים, בעלי עסקים וצוות לובי: נכנסים עם קוד חד-פעמי למייל." />;
  }
  if (error) return <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>;
  if (!roles || home) return loading;

  return (
    <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-bold">החשבון עוד לא משויך</h1>
      <p className="text-lg">
        דיירים מצטרפים דרך קישור הבניין שוועד הבית שולח. בעלי עסקים נכנסים עם המייל שנרשמו איתו ללובי.
      </p>
      <button type="button" onClick={() => supabase.auth.signOut()} className={buttonClass("secondary")}>יציאה מהחשבון</button>
    </section>
  );
}
