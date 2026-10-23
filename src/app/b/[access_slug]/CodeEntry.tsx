"use client";

import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/Field";
import { primaryButton, secondaryButton } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { verifyCode } from "@/lib/api/terminal";
import { isValidCode, normalizeCode } from "@/lib/codes";
import { native } from "@/lib/native";
import type { VerifyResult } from "@/lib/redemptions/types";

interface Props {
  token: string;
  onResult: (code: string, result: VerifyResult) => void;
  onUnauthorized: () => void;
}

/** Big code field (text keypad, auto-uppercase) plus QR scan. Checks automatically once 6 valid characters are in. */
export function CodeEntry({ token, onResult, onUnauthorized }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /** Sends a code to the server and hands the result up. */
  async function check(value: string) {
    if (pending || value.length !== 6) return;
    setPending(true);
    setError(null);
    const res = await verifyCode(token, value);
    setPending(false);
    if (!isApiError(res)) return onResult(value, res);
    if (res.unauthorized) onUnauthorized();
    else setError(res.error);
  }

  function onChange(raw: string) {
    const value = normalizeCode(raw).slice(0, 6);
    setCode(value);
    if (isValidCode(value)) check(value);
  }

  /** Opens the camera scanner and checks the scanned code. */
  async function scan() {
    setError(null);
    try {
      const scanned = await native.qrScanner.scan();
      if (scanned === null) return;
      const value = normalizeCode(scanned);
      if (!isValidCode(value)) return setError("ה-QR שנסרק אינו קוד של לובי");
      setCode(value);
      check(value);
    } catch {
      setError("אין גישה למצלמה. אפשר להקליד את הקוד.");
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        check(code);
      }}
    >
      <label className="flex flex-col gap-2 text-center">
        <span className="text-2xl font-bold">קוד הדייר</span>
        <input
          value={code}
          onChange={(e) => onChange(e.target.value)}
          inputMode="text"
          autoFocus
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          dir="ltr"
          placeholder="••••••"
          aria-invalid={!!error}
          className={`${inputClass} py-4 text-center font-mono text-5xl font-bold uppercase tracking-[0.3em] placeholder:text-navy/20`}
        />
        <span className="text-sm text-navy/70">הקוד מופיע במסך של הדייר. אין בו O, I, L, 0 או 1.</span>
      </label>
      {error && <p role="alert" className="text-center text-lg text-red-700">{error}</p>}
      <button type="submit" disabled={pending || code.length !== 6} className={primaryButton}>
        {pending ? "בודקים…" : "בדיקת קוד"}
      </button>
      <button type="button" onClick={scan} disabled={pending} className={secondaryButton}>
        סריקת QR
      </button>
    </form>
  );
}
