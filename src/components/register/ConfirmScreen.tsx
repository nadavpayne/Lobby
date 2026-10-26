"use client";

import { Check, ChevronRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { formatAgorot, parseBillAgorot, splitBill } from "@/lib/qr/money";
import type { ApproveResult, ScanResult } from "@/lib/qr/types";

type Ok = Extract<ScanResult, { code: "OK" }>;
type Approved = Extract<ApproveResult, { code: "OK" }>;

interface Props {
  scan: Ok;
  businessName: string;
  station: string;
  /** Sends the approval; resolves with the result or an error message (network loss: the cashier may retry safely). */
  onApprove: (amount: string) => Promise<ApproveResult | string>;
  /** A non-OK approve result (e.g. lost a race) → show its error screen. */
  onRejected: (result: Exclude<ApproveResult, { code: "OK" }>) => void;
  onNext: () => void;
}

const money = (agorot: number) => <bdi dir="ltr">{formatAgorot(agorot)}</bdi>;

/** Valid code: checks shown, bill amount with live discount and amount to charge, Approve; then the success state. */
export function ConfirmScreen({ scan, businessName, station, onApprove, onRejected, onNext }: Props) {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState<Approved | null>(null);
  const bill = parseBillAgorot(amount);
  const preview = bill === null ? null : splitBill(bill, scan.discountRate, scan.commissionRate, scan.commissionBase);

  /** Approves; on a network error the same scan can be retried (the server returns the same redemption). */
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (bill === null || pending) return;
    setPending(true);
    setError(null);
    const res = await onApprove(amount);
    setPending(false);
    if (typeof res === "string") return setError(`${res} אפשר ללחוץ שוב בבטחה: המימוש לא יירשם פעמיים.`);
    if (res.code === "OK") setApproved(res);
    else onRejected(res);
  }

  const header = (
    <header className="flex items-center gap-3">
      <button type="button" onClick={onNext} aria-label="ביטול וחזרה לסריקה" className="grid size-11 place-items-center rounded-xl border border-hairline bg-white">
        <ChevronRight aria-hidden className="size-5" />
      </button>
      <h1 className="text-lg font-bold">אישור הטבה</h1>
      <span className="ms-auto truncate text-sm text-muted">{businessName} · {station}</span>
    </header>
  );

  if (approved) {
    const r = approved.receipt;
    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 md:min-h-[680px]">
        {header}
        <div role="status" className="flex flex-1 animate-pop-in flex-col items-center justify-center gap-4 text-center">
          <span aria-hidden className="grid size-24 place-items-center rounded-full bg-amber text-navy"><Check className="size-12" strokeWidth={2.5} /></span>
          <h2 className="text-[28px] leading-9 font-extrabold">ההטבה מומשה</h2>
          <p className="max-w-[280px] text-[15px] leading-[22px] text-muted">נגבו {money(r.paidAgorot)} מתוך {money(r.billAgorot)}. ההנחה ({money(r.discountAgorot)}) נרשמה.</p>
        </div>
        <Button variant="navy" onClick={onNext} autoFocus>סריקה הבאה</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 md:min-h-[680px]">
      {header}
      <section className="flex flex-col gap-3.5 rounded-[20px] bg-white p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-white"><Check className="size-[22px]" strokeWidth={2.5} /></span>
          <div>
            <p className="text-[17px] font-bold">הקוד תקין</p>
            <p className="text-sm text-muted">חבר מועדון Lobby · דירה {scan.apartmentNumber}</p>
          </div>
        </div>
        <div className="h-px bg-hairline" />
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2"><Check aria-hidden className="size-[18px]" /> הטבה ראשונה של הדירה אצלכם החודש</li>
          <li className="flex items-center gap-2"><Check aria-hidden className="size-[18px]" /> קוד בתוקף, נסרק פעם אחת</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3.5 rounded-[28px] bg-white p-5 shadow-lift">
        <label htmlFor="bill" className="text-sm font-semibold">סכום החשבון לפני הנחה</label>
        <div className="flex h-[60px] items-center gap-2 rounded-xl border-2 border-navy px-3.5 focus-within:ring-2 focus-within:ring-amber">
          <span aria-hidden className="text-[26px] font-bold text-muted">₪</span>
          <input
            id="bill"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            enterKeyHint="done"
            placeholder="0.00"
            dir="ltr"
            className="min-w-0 flex-1 rounded-lg bg-transparent text-right text-3xl font-extrabold placeholder:text-navy/20"
          />
        </div>
        <div className="flex justify-between text-[15px]">
          <span className="text-muted">הנחת Lobby (<bdi dir="ltr">{scan.discountRate}%</bdi>)</span>
          <span className="font-bold">−{money(preview?.discountAgorot ?? 0)}</span>
        </div>
        <div className="h-px bg-hairline" />
        <div className="flex items-baseline justify-between">
          <span className="font-semibold">לגבייה מהלקוח</span>
          <span className="text-3xl font-black">{money(preview?.paidAgorot ?? 0)}</span>
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-2.5">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Button type="submit" variant="navy" disabled={bill === null || pending}>{pending ? "רושמים…" : error ? "נסו שוב" : "אישור ומימוש ההטבה"}</Button>
        <p className="text-center text-xs text-muted">המימוש נרשם בדוח החודשי של העסק</p>
      </div>
    </form>
  );
}
