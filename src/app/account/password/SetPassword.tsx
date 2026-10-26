"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { EmailCodeLogin } from "@/components/auth/EmailCodeLogin";
import { Field, inputClass } from "@/components/Field";
import { buttonClass, Loading, primaryButton } from "@/components/ui";
import { MIN_PASSWORD, setPassword } from "@/lib/auth/authActions";
import { useSupabaseSession } from "@/lib/supabase/useSession";

/**
 * Set or change the account's password. Reached from the account menu, or from a "forgot password" email
 * (its link signs the user in here). Signed out → sign in first with an email code.
 */
export function SetPassword() {
  const { supabase, session } = useSupabaseSession();
  const [password, setPasswordValue] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  if (!supabase || session === undefined) return <Loading />;
  if (!session) {
    return <EmailCodeLogin supabase={supabase} shouldCreateUser={false} title="קביעת סיסמה" subtitle="קודם נכנסים עם קוד חד-פעמי למייל, ואז קובעים סיסמה." />;
  }

  /** Checks both fields match, then saves the password. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== again) return setError("הסיסמאות לא זהות");
    setPending(true);
    const err = await setPassword(supabase!, password);
    setPending(false);
    setError(err);
    setSaved(!err);
  }

  if (saved) {
    return (
      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-bold">הסיסמה נשמרה</h1>
        <p className="text-lg">מעכשיו אפשר להיכנס עם <bdi dir="ltr">{session.user.email}</bdi> והסיסמה.</p>
        <Link href="/start" className={buttonClass("primary")}>לאפליקציה שלי</Link>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">קביעת סיסמה</h1>
        <p className="text-lg">לחשבון <bdi dir="ltr">{session.user.email}</bdi>. לפחות {MIN_PASSWORD} תווים.</p>
      </div>
      <Field label="סיסמה חדשה">
        <input type="password" autoComplete="new-password" dir="ltr" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPasswordValue(e.target.value)} className={inputClass} />
      </Field>
      <Field label="שוב, לאימות" error={error ?? undefined}>
        <input type="password" autoComplete="new-password" dir="ltr" required value={again} onChange={(e) => setAgain(e.target.value)} aria-invalid={!!error} className={inputClass} />
      </Field>
      <button type="submit" disabled={pending || !password || !again} className={primaryButton}>
        {pending ? "שומרים…" : "שמירת הסיסמה"}
      </button>
    </form>
  );
}
