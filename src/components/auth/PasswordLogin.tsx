"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { primaryButton } from "@/components/ui";
import { sendPasswordReset, signInWithPassword } from "@/lib/auth/authActions";

interface Props {
  supabase: SupabaseClient;
  email: string;
  onEmailChange: (email: string) => void;
}

/** Email + password sign-in, with "forgot password" (emails a link to set a new one). */
export function PasswordLogin({ supabase, email, onEmailChange }: Props) {
  const [password, setPasswordValue] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Signs in; Supabase stores the session and the parent page picks it up. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setNotice(null);
    setError(await signInWithPassword(supabase, email, password));
    setPending(false);
  }

  /** Emails a reset link to the typed address. */
  async function forgot() {
    if (!email.trim()) return setError("הקלידו קודם את האימייל");
    setPending(true);
    const err = await sendPasswordReset(supabase, email);
    setPending(false);
    setError(err);
    if (!err) setNotice(`שלחנו ל-${email.trim()} קישור לקביעת סיסמה חדשה.`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Field label="אימייל">
        <input type="email" inputMode="email" autoComplete="email" dir="ltr" required value={email} onChange={(e) => onEmailChange(e.target.value)} className={inputClass} />
      </Field>
      <Field label="סיסמה" error={error ?? undefined}>
        <span className="relative block">
          <input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            dir="ltr"
            required
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            aria-invalid={!!error}
            className={`${inputClass} ps-12`}
          />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? "הסתרת הסיסמה" : "הצגת הסיסמה"} className="absolute inset-y-0 start-0 grid w-11 place-items-center text-navy/60">
            {show ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        </span>
      </Field>
      {notice && <p role="status" className="rounded-xl bg-mint p-3">{notice}</p>}
      <button type="submit" disabled={pending || !email.trim() || !password} className={primaryButton}>
        {pending ? "רגע…" : "התחברות"}
      </button>
      <button type="button" onClick={forgot} disabled={pending} className="min-h-11 self-center px-2 font-bold text-navy underline">
        שכחתי סיסמה / עוד אין לי סיסמה
      </button>
    </form>
  );
}
