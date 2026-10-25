"use client";

import { useState } from "react";
import { isApiError } from "@/lib/api/http";
import { resetDemo } from "@/lib/api/terminal";
import { DEMO_CODE } from "@/lib/demo/constants";
import { formatBackupCode } from "@/lib/qr/backupCode";

/** Demo business only: one tap makes the demo code unused and valid again, between sales meetings. */
export function DemoReset({ token, onReset, onUnauthorized }: { token: string; onReset: () => void; onUnauthorized: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function reset() {
    setPending(true);
    const res = await resetDemo(token);
    setPending(false);
    if (!isApiError(res)) {
      setMessage(`הקוד ${formatBackupCode(DEMO_CODE)} תקף שוב`);
      return onReset();
    }
    if (res.unauthorized) onUnauthorized();
    else setMessage(res.error);
  }

  return (
    <div className="flex flex-col items-center gap-1 border-t border-navy/10 pt-4 text-center">
      <p className="text-sm text-navy/70">
        מצב הדגמה · קוד גיבוי לדוגמה: <bdi dir="ltr" className="font-mono font-bold">{formatBackupCode(DEMO_CODE)}</bdi>
      </p>
      <button type="button" onClick={reset} disabled={pending} className="min-h-11 px-3 font-medium underline disabled:opacity-50">
        {pending ? "מאפסים…" : "איפוס הדגמה"}
      </button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  );
}
