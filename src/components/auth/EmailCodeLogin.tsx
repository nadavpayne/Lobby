"use client";

import type { AuthError, SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { primaryButton } from "@/components/ui";

const RESEND_SECONDS = 60; // Supabase's default minimum gap between codes to the same email
// Must match Supabase → Authentication → Email → "Email OTP Length" (set to 6 in both projects).
const CODE_LENGTH = 6;

/** Hebrew message for a failed "send code" call. */
function sendError(error: AuthError): string {
  if (error.status === 429) return "נשלחו יותר מדי קודים. נסו שוב בעוד כמה דקות.";
  if (/signups? not allowed/i.test(error.message)) return "אין חשבון עם האימייל הזה";
  return "לא הצלחנו לשלוח קוד. בדקו את האימייל ונסו שוב.";
}

interface Props {
  supabase: SupabaseClient;
  /** false = only existing accounts can sign in (admin). */
  shouldCreateUser: boolean;
  title: string;
  subtitle?: string;
}

/**
 * Sign-in with a one-time code sent by email (no redirect link, so it works the same inside the app).
 * On success Supabase stores the session; the parent picks it up from onAuthStateChange.
 */
export function EmailCodeLogin({ supabase, shouldCreateUser, title, subtitle }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  /** Emails a fresh code and moves to the code step. */
  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setPending(true);
    setError(null);
    // The email has a code if the Supabase template shows {{ .Token }}, otherwise a link back to this page.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser, emailRedirectTo: window.location.origin + window.location.pathname },
    });
    setPending(false);
    if (error) return setError(sendError(error));
    setStep("code");
    setCode("");
    setResendIn(RESEND_SECONDS);
  }

  /** Checks the code; Supabase signs the user in on success. */
  async function verify(value: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: value, type: "email" });
    setPending(false);
    if (error) {
      setError("הקוד שגוי או שפג תוקפו");
      setCode("");
    }
  }

  function onCodeChange(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) verify(digits);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="text-lg">{subtitle}</p>}
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-5">
          <Field label="אימייל" error={error ?? undefined}>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              className={inputClass}
            />
          </Field>
          <button type="submit" disabled={pending || !email.trim()} className={primaryButton}>
            {pending ? "שולחים…" : "שליחת קוד"}
          </button>
          <p className="text-center text-sm text-navy/70">
            בהתחברות אתם מסכימים ל<Link href="/terms" className="underline">תקנון</Link> ול
            <Link href="/privacy" className="underline">מדיניות הפרטיות</Link>.
          </p>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); verify(code); }} className="flex flex-col gap-5">
          <p className="text-lg">
            שלחנו מייל ל-<bdi dir="ltr">{email.trim()}</bdi>. הקלידו את הקוד שבו, או פשוט לחצו על הקישור שבמייל.
          </p>
          <Field label="הקוד מהאימייל" error={error ?? undefined}>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              dir="ltr"
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              aria-invalid={!!error}
              className={`${inputClass} py-3 text-center text-3xl tracking-[0.4em]`}
            />
          </Field>
          <button type="submit" disabled={pending || code.length !== CODE_LENGTH} className={primaryButton}>
            {pending ? "בודקים…" : "כניסה"}
          </button>
          <div className="flex justify-between gap-3">
            <button type="button" onClick={() => setStep("email")} className="min-h-11 px-2 underline">
              אימייל אחר
            </button>
            <button type="button" onClick={() => sendCode()} disabled={resendIn > 0 || pending} className="min-h-11 px-2 underline disabled:no-underline disabled:opacity-60">
              {resendIn > 0 ? `שליחה חוזרת בעוד ${resendIn}` : "שליחת קוד חדש"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
