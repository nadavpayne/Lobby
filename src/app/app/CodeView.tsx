"use client";

import { CheckCircle2, TimerOff } from "lucide-react";
import { useEffect, useState } from "react";
import { QrCode } from "@/components/QrCode";
import { Button } from "@/components/ui";
import type { IssuedCode } from "@/lib/offers/types";
import { formatCountdown, secondsUntil, spacedCode } from "@/lib/time/countdown";

interface Props {
  code: IssuedCode;
  onClose: () => void;
  /** Gets a fresh code after this one expired. */
  onRenew?: () => void;
  /** The business has redeemed it (the screen turns into a confirmation). */
  redeemed?: boolean;
}

/** Full-screen code for the register: big digits + QR with a live 10-minute countdown; then expired or redeemed. */
export function CodeView({ code, onClose, onRenew, redeemed = false }: Props) {
  const [left, setLeft] = useState(() => secondsUntil(code.expiresAt));

  useEffect(() => {
    const tick = setInterval(() => setLeft(secondsUntil(code.expiresAt)), 1000);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearInterval(tick);
      window.removeEventListener("keydown", onKey);
    };
  }, [code.expiresAt, onClose]);

  const expired = !redeemed && left === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`הקוד שלך ב${code.businessName}`}
      className="fixed inset-0 z-30 flex animate-pop-in flex-col items-center gap-5 overflow-y-auto bg-cream px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center"
    >
      <p className="text-lg text-navy/70">הקוד שלך ב-</p>
      <h2 className="-mt-4 text-3xl font-bold">{code.businessName}</h2>
      <p className="rounded-full bg-amber/25 px-4 py-1 text-xl font-bold">
        <bdi dir="ltr">{code.discountPercent}%</bdi> הנחה
      </p>

      {redeemed && (
        <div role="status" className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-mint p-6 shadow-soft">
          <CheckCircle2 aria-hidden className="size-16 text-emerald-700" />
          <p className="text-2xl font-bold">ההטבה מומשה!</p>
          <p>החיסכון נוסף לארנק שלכם. בתיאבון ותיהנו 🎉</p>
        </div>
      )}

      {expired && (
        <div role="alert" className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-white p-6 shadow-soft">
          <TimerOff aria-hidden className="size-12 text-navy/50" />
          <p className="text-2xl font-bold">פג תוקף הקוד</p>
          <p>הקוד תקף 10 דקות. אפשר לקבל קוד חדש, ההטבה החודשית עדיין שלכם.</p>
          {onRenew && <Button onClick={onRenew}>קבלת קוד חדש</Button>}
        </div>
      )}

      {!redeemed && !expired && (
        <>
          <p dir="ltr" aria-label={`קוד ${code.code.split("").join(" ")}`} className="w-full max-w-sm rounded-3xl bg-white py-5 font-mono text-5xl font-bold tracking-[0.2em] shadow-soft">
            {spacedCode(code.code)}
          </p>
          <div className="rounded-3xl bg-white p-3 shadow-soft">
            <QrCode value={code.code} size={200} />
          </div>
          <p className="text-lg">הציגו בקופה לפני התשלום</p>
          <p role="timer" aria-live="off" className={`rounded-full px-4 py-1.5 font-bold tabular-nums ${left <= 60 ? "bg-rose text-red-800" : "bg-sky"}`}>
            בתוקף עוד <bdi dir="ltr">{formatCountdown(left)}</bdi>
          </p>
        </>
      )}

      <Button variant={redeemed ? "primary" : "secondary"} onClick={onClose} className="mt-auto max-w-sm">סגירה</Button>
    </div>
  );
}
