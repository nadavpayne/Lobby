"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { useState, type FormEvent } from "react";
import { Field, inputClass } from "@/components/Field";
import { primaryButton } from "@/components/ui";

/** Sends a magic sign-in link. shouldCreateUser: false — only the existing admin account can get one. */
export function AdminLogin({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/admin` },
    });
    setState(error ? "error" : "sent");
  }

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col gap-2 pt-6 text-center">
        <h1 className="text-2xl font-bold">בדקו את האימייל</h1>
        <p className="text-lg">שלחנו קישור כניסה ל-<bdi dir="ltr">{email.trim()}</bdi>. הקישור יחזיר אתכם לכאן.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">כניסת מנהל</h1>
      <Field label="אימייל" error={state === "error" ? "לא הצלחנו לשלוח קישור לכתובת הזו" : undefined}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          dir="ltr"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={state === "error"}
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={state === "sending" || !email.trim()} className={primaryButton}>
        {state === "sending" ? "שולחים…" : "שליחת קישור כניסה"}
      </button>
    </form>
  );
}
