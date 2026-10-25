"use client";

import { Copy, KeyRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/Field";
import { Button, Card } from "@/components/ui";
import { changePin } from "@/lib/api/biz";
import { isApiError } from "@/lib/api/http";
import { isValidPin } from "@/lib/biz/validateProfile";

/** Team access: staff use the terminal link + PIN and can only redeem codes. The owner can copy the link and change the PIN. */
export function StaffCard({ token, terminalUrl }: { token: string; terminalUrl: string }) {
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /** Copies the terminal link. */
  async function copy() {
    await navigator.clipboard.writeText(terminalUrl).catch(() => null);
    setCopied(true);
  }

  /** Sets the new PIN. */
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!isValidPin(pin)) return setMessage({ ok: false, text: "קוד PIN חייב להיות 4 ספרות" });
    const res = await changePin(token, pin);
    if (isApiError(res)) return setMessage({ ok: false, text: res.error });
    setPin("");
    setMessage({ ok: true, text: "הקוד עודכן. כל מכשירי הקופה יתבקשו להזין אותו מחדש." });
  }

  return (
    <Card tint="sky" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">צוות וקופה</h2>
        <p>עובדי הקופה נכנסים דרך הקישור הזה עם קוד PIN. הם יכולים רק לממש הטבות, בלי גישה לנתונים ולחיובים.</p>
      </div>
      <p dir="ltr" className="select-all break-all rounded-xl bg-white p-3 font-mono text-sm">{terminalUrl}</p>
      <Button size="md" variant="navy" onClick={copy}><Copy aria-hidden className="size-4" /> {copied ? "הקישור הועתק" : "העתקת הקישור"}</Button>
      <form onSubmit={submit} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-medium">קוד PIN חדש לקופה</span>
          <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="new-password" dir="ltr" placeholder="4 ספרות" className={inputClass} />
        </label>
        <Button type="submit" size="md" variant="secondary"><KeyRound aria-hidden className="size-4" /> עדכון קוד PIN</Button>
        {message && <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-emerald-800" : "text-red-700"}>{message.text}</p>}
      </form>
    </Card>
  );
}
