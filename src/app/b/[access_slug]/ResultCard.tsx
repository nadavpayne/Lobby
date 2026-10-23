"use client";

import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/Field";
import { DetailRow, primaryButton, secondaryButton } from "@/components/ui";
import { isApiError } from "@/lib/api/http";
import { redeemCode } from "@/lib/api/terminal";
import { calcRedemption, COMMISSION_PERCENT, formatShekels, parseAmount } from "@/lib/redemptions/money";
import type { RedeemResult, VerifyResult } from "@/lib/redemptions/types";

interface Props {
  token: string;
  code: string;
  result: VerifyResult;
  onRedeemed: (result: RedeemResult) => void;
  onBack: () => void;
  onUnauthorized: () => void;
}

const dateTime = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

const NOT_VALID = {
  used: { title: "הקוד כבר מומש", tone: "bg-red-50 text-red-900" },
  expired: { title: "פג תוקף הקוד", tone: "bg-amber/20" },
  invalid: { title: "קוד לא נמצא", tone: "bg-red-50 text-red-900" },
} as const;

/** Result of a code check: a valid code continues to the bill amount; anything else explains why not. */
export function ResultCard({ result, ...props }: Props) {
  if (result.status === "valid") return <ValidCode result={result} {...props} />;

  const { title, tone } = NOT_VALID[result.status];
  return (
    <div className="flex flex-col gap-4">
      <div role="alert" className={`flex flex-col gap-2 rounded-2xl p-5 text-center ${tone}`}>
        <p className="text-3xl font-bold">{title}</p>
        <p dir="ltr" className="font-mono text-xl">{props.code}</p>
        <p className="text-lg">
          {result.status === "used" && <>מומש ב-<bdi dir="ltr">{dateTime.format(new Date(result.redeemedAt))}</bdi></>}
          {result.status === "expired" && "הדייר יכול להפיק קוד חדש."}
          {result.status === "invalid" && "בדקו שהקוד הוקלד נכון."}
        </p>
      </div>
      <button type="button" onClick={props.onBack} className={primaryButton}>קוד אחר</button>
    </div>
  );
}

/** Valid code: shows the resident details, takes the full bill and confirms the redemption. */
function ValidCode({ token, code, result, onRedeemed, onBack, onUnauthorized }: Omit<Props, "result"> & { result: Extract<VerifyResult, { status: "valid" }> }) {
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amount = parseAmount(amountText);
  const preview = amount === null ? null : calcRedemption(amount, result.discountPercent);

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (amount === null || pending) return;
    setPending(true);
    setError(null);
    const res = await redeemCode(token, code, amount);
    setPending(false);
    if (!isApiError(res)) return onRedeemed(res);
    if (res.unauthorized) onUnauthorized();
    else setError(res.error);
  }

  return (
    <form onSubmit={confirm} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-3xl font-bold text-emerald-700">
          <span aria-hidden>✓</span> קוד תקין
        </p>
        <DetailRow label="קוד"><bdi dir="ltr" className="font-mono">{code}</bdi></DetailRow>
        <DetailRow label="הנחה"><bdi dir="ltr">{result.discountPercent}%</bdi></DetailRow>
        {result.residentName && <DetailRow label="שם הדייר">{result.residentName}</DetailRow>}
        <DetailRow label="בניין">{result.buildingAddress}</DetailRow>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xl font-bold">סכום החשבון לפני ההנחה</span>
        <span className="relative" dir="ltr">
          <span aria-hidden className="absolute inset-y-0 start-4 flex items-center text-2xl text-navy/60">₪</span>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            autoFocus
            enterKeyHint="done"
            placeholder="0.00"
            className={`${inputClass} py-3 ps-12 text-3xl font-bold`}
          />
        </span>
      </label>

      {preview && (
        <div className="flex flex-col gap-2 rounded-2xl bg-navy/5 p-5">
          <DetailRow label={`הנחה (${result.discountPercent}%)`}><bdi dir="ltr">-{formatShekels(preview.discountAmount)}</bdi></DetailRow>
          <DetailRow label="הדייר משלם" strong><bdi dir="ltr">{formatShekels(preview.payAmount)}</bdi></DetailRow>
          <p className="text-sm text-navy/70">
            עמלת לובי (<bdi dir="ltr">{COMMISSION_PERCENT}%</bdi>): <bdi dir="ltr">{formatShekels(preview.commissionAmount)}</bdi>
          </p>
        </div>
      )}

      {error && <p role="alert" className="text-center text-lg text-red-700">{error}</p>}
      <button type="submit" disabled={amount === null || pending} className={primaryButton}>
        {pending ? "מאשרים…" : "אישור מימוש"}
      </button>
      <button type="button" onClick={onBack} disabled={pending} className={secondaryButton}>ביטול</button>
    </form>
  );
}
