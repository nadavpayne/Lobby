"use client";

import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/Field";
import { primaryButton } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { loginTerminal } from "@/lib/api/terminal";
import type { BusinessInfo } from "@/lib/businesses/types";

/** One-time PIN entry for this device. Submits automatically on the 4th digit. */
export function PinForm({ slug, onLogin }: { slug: string; onLogin: (token: string, business: BusinessInfo) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Sends the PIN; clears the field on failure so the next try starts fresh. */
  async function submit(value: string) {
    if (pending || !/^\d{4}$/.test(value)) return;
    setPending(true);
    setError(null);
    const res = await loginTerminal(slug, value);
    setPending(false);
    if (isApiError(res)) {
      setError(res.error);
      setPin("");
    } else onLogin(res.token, res.business);
  }

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setPin(digits);
    if (digits.length === 4) submit(digits);
  }

  return (
    <form
      className="flex flex-col gap-6 pt-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        submit(pin);
      }}
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-bold">כניסה למסך האימות</h1>
        <p className="text-lg">הזינו את קוד ה-PIN שבחרתם בהרשמה. נבקש אותו רק פעם אחת במכשיר הזה.</p>
      </div>
      <input
        aria-label="קוד PIN"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        dir="ltr"
        value={pin}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`${inputClass} mx-auto max-w-56 py-3 text-center text-4xl tracking-[0.6em]`}
      />
      {error && <p role="alert" className="text-center text-lg text-red-700">{error}</p>}
      <button type="submit" disabled={pending || pin.length !== 4} className={primaryButton}>
        {pending ? "בודקים…" : "כניסה"}
      </button>
    </form>
  );
}
