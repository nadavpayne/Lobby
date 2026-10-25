"use client";

import { useEffect } from "react";
import { QrCode } from "@/components/QrCode";
import { primaryButton } from "@/components/ui";
import type { IssuedCode } from "@/lib/offers/types";

const until = new Intl.DateTimeFormat("he-IL", { weekday: "long", hour: "2-digit", minute: "2-digit" });

/** Full-screen code to show at the register: big letters + QR, valid until a time. */
export function CodeView({ code, onClose }: { code: IssuedCode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`הקוד שלך ב${code.businessName}`}
      className="fixed inset-0 z-30 flex flex-col items-center gap-5 overflow-y-auto bg-cream px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center"
    >
      <p className="text-lg text-navy/70">הקוד שלך ב-</p>
      <h2 className="-mt-4 text-3xl font-bold">{code.businessName}</h2>
      <p className="rounded-full bg-amber/25 px-4 py-1 text-xl font-bold">
        <bdi dir="ltr">{code.discountPercent}%</bdi> הנחה
      </p>
      <p dir="ltr" className="w-full max-w-sm rounded-2xl bg-white py-5 font-mono text-5xl font-bold tracking-[0.25em] shadow-sm">
        {code.code}
      </p>
      <div className="rounded-2xl bg-white p-3 shadow-sm">
        <QrCode value={code.code} size={200} />
      </div>
      <p className="text-lg">הציגו בקופה לפני התשלום · בתוקף עד {until.format(new Date(code.expiresAt))}</p>
      <button type="button" onClick={onClose} className={`${primaryButton} mt-auto max-w-sm`}>סגירה</button>
    </div>
  );
}
