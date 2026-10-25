"use client";

import { DetailRow, primaryButton } from "@/components/ui";
import { formatShekels } from "@/lib/redemptions/money";
import type { RedeemResult } from "@/lib/redemptions/types";

/** Confirmation after a successful redemption, with the money breakdown. */
export function RedeemedCard({ result, onNext }: { result: Extract<RedeemResult, { status: "redeemed" }>; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div role="status" className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <p className="flex items-center gap-2 text-3xl font-bold text-emerald-700">
          <span aria-hidden>✓</span> המימוש אושר
        </p>
        <DetailRow label="סכום החשבון"><bdi dir="ltr">{formatShekels(result.amount)}</bdi></DetailRow>
        <DetailRow label={`הנחה (${result.discountPercent}%)`}><bdi dir="ltr">-{formatShekels(result.discountAmount)}</bdi></DetailRow>
        <DetailRow label="הדייר משלם" strong><bdi dir="ltr">{formatShekels(result.payAmount)}</bdi></DetailRow>
      </div>
      <button type="button" onClick={onNext} className={primaryButton} autoFocus>קוד הבא</button>
    </div>
  );
}
