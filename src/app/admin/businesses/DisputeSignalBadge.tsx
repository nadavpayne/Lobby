import Link from "next/link";
import { Tag } from "@/components/ui";
import type { DisputeSignal } from "@/lib/disputes/types";
import { formatAgorot } from "@/lib/qr/money";

const pct = (rate: number) => `${Math.round(rate * 100)}%`;

/** Header tag: this month's amount reports for the business; red when its dispute rate crosses the threshold. */
export function DisputeSignalTag({ signal }: { signal: DisputeSignal | undefined }) {
  if (!signal || signal.disputes === 0) return null;
  return (
    <Tag tint={signal.flagged ? "rose" : "white"}>
      {signal.flagged ? "⚠ " : ""}{signal.disputes} דיווחים · {pct(signal.rate)}
    </Tag>
  );
}

/** Expanded row: dispute rate, corrections, and the business's average bill against similar businesses. */
export function DisputeSignalLine({ signal, businessId }: { signal: DisputeSignal | undefined; businessId: string }) {
  if (!signal) return null;
  const vsPeers = signal.avgBillAgorot !== null && signal.peerAvgBillAgorot ? signal.avgBillAgorot / signal.peerAvgBillAgorot - 1 : null;
  return (
    <p className={`rounded-xl p-3 text-sm ${signal.flagged ? "bg-rose" : "bg-cream"}`}>
      החודש: {signal.redemptions} מימושים, {signal.disputes} דיווחים על סכום ({pct(signal.rate)}), {signal.corrections} תוקנו
      {signal.corrections > 0 && <> (<bdi dir="ltr">{formatAgorot(signal.correctedAgorot)}</bdi>)</>}.
      {signal.avgBillAgorot !== null && <> חשבון ממוצע <bdi dir="ltr">{formatAgorot(signal.avgBillAgorot)}</bdi></>}
      {vsPeers !== null && <> ({vsPeers >= 0 ? "+" : ""}{Math.round(vsPeers * 100)}% מול עסקים דומים)</>}
      {signal.disputes > 0 && <> · <Link href={`/admin/disputes?business=${businessId}`} className="underline">לדיווחים</Link></>}
    </p>
  );
}
