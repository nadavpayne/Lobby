"use client";

import { CalendarDays, Check } from "lucide-react";
import { useState } from "react";
import { PushPrompt } from "@/components/native/PushPrompt";
import { DisputeSheet } from "@/components/resident/DisputeSheet";
import { Button } from "@/components/ui";
import { receiptTime, unlockDay } from "@/lib/qr/labels";
import { formatAgorot } from "@/lib/qr/money";
import type { TokenStatus } from "@/lib/qr/types";

const money = (agorot: number) => <bdi dir="ltr">{formatAgorot(agorot)}</bdi>;

/** The resident's success screen: what they saved, the receipt (with "amount not right?"), and when the next benefit here unlocks. */
export function DoneView({ authToken, done, onClose }: { authToken: string; done: Extract<TokenStatus, { status: "used" }>; onClose: () => void }) {
  const r = done.receipt;
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  return (
    <div role="status" className="flex min-h-full flex-1 animate-pop-in flex-col gap-5">
      <span dir="ltr" className="self-end text-xl font-black tracking-tight">Lobby</span>
      <div className="flex flex-col items-center gap-3.5 pt-6 text-center">
        <span aria-hidden className="grid size-24 place-items-center rounded-full bg-navy text-white ring-8 ring-amber">
          <Check className="size-12" strokeWidth={2.5} />
        </span>
        <h1 className="mt-3 text-3xl leading-[2.375rem] font-extrabold">ההטבה מומשה!</h1>
        <p className="text-[1.0625rem]">חסכתם <strong className="font-extrabold">{money(r.discountAgorot)}</strong> ב{done.businessName}</p>
      </div>

      <section className="flex flex-col gap-3 rounded-[28px] bg-white p-5 text-[0.9375rem] shadow-lift">
        <div className="flex justify-between"><span className="text-muted">סכום החשבון</span>{money(r.billAgorot)}</div>
        <div className="flex justify-between"><span className="text-muted">הנחת Lobby (<bdi dir="ltr">{r.discountRate}%</bdi>)</span><span className="font-bold">−{money(r.discountAgorot)}</span></div>
        <div className="h-px bg-hairline" />
        <div className="flex items-baseline justify-between"><span className="font-semibold">שילמתם</span><span className="text-2xl font-black">{money(r.paidAgorot)}</span></div>
        <p className="text-center text-xs text-muted">{receiptTime(r.redeemedAt)} · דירה {r.apartmentNumber}</p>
      </section>
      {reported
        ? <p className="-mt-2 text-center text-sm text-muted">הדיווח על הסכום נשלח. נבדוק ונחזור אליכם.</p>
        : <button type="button" onClick={() => setReporting(true)} className="-mt-2 min-h-11 self-center text-sm text-muted underline">הסכום לא נכון?</button>}
      <DisputeSheet
        token={authToken}
        target={reporting ? { redemptionId: r.redemptionId, businessName: done.businessName, redeemedAt: r.redeemedAt, billAgorot: r.billAgorot } : null}
        onClose={() => setReporting(false)}
        onReported={() => setReported(true)}
      />

      <div className="flex items-start gap-2.5 rounded-2xl bg-warm p-3.5 text-sm leading-5">
        <CalendarDays aria-hidden className="mt-0.5 size-5 shrink-0" />
        <p>ההטבה הבאה ב{done.businessName} תהיה זמינה ב-{unlockDay(done.renewsOn)}. בינתיים יש עוד עסקים בשכונה שמחכים לכם.</p>
      </div>

      <PushPrompt token={authToken} text="נשלח התראה כשעסק חדש ליד הבית מצטרף, כדי שלא תפספסו הטבות." />
      <Button variant="navy" onClick={onClose} className="mt-auto">להטבות נוספות</Button>
    </div>
  );
}
