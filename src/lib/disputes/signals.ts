// Which businesses residents dispute unusually often. Pure.
import { FLAG_DISPUTE_RATE, FLAG_MIN_DISPUTES } from "./config.ts";
import type { DisputeSignal, DisputeStatus } from "./types.ts";

export interface SignalInput {
  /** The month's redeemed purchases. */
  redemptions: { businessId: string; billAgorot: number }[];
  /** Disputes on the month's redemptions; corrected ones carry how much the bill went up or down. */
  disputes: { businessId: string; status: DisputeStatus; billDiffAgorot: number }[];
  /** Comparison group per business (its first subcategory, or its category). */
  peerGroup: Map<string, string>;
}

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : null);

/** Dispute rate, corrections and average bill vs. peers, for every business with redemptions or disputes. */
export function disputeSignals({ redemptions, disputes, peerGroup }: SignalInput): DisputeSignal[] {
  const bills = new Map<string, number[]>();
  for (const r of redemptions) bills.set(r.businessId, [...(bills.get(r.businessId) ?? []), r.billAgorot]);
  const ids = new Set([...bills.keys(), ...disputes.map((d) => d.businessId)]);

  return [...ids].map((businessId) => {
    const own = bills.get(businessId) ?? [];
    const mine = disputes.filter((d) => d.businessId === businessId);
    const corrected = mine.filter((d) => d.status === "CORRECTED");
    const group = peerGroup.get(businessId);
    const peers = [...bills].filter(([id]) => id !== businessId && group !== undefined && peerGroup.get(id) === group).flatMap(([, b]) => b);
    const rate = own.length ? mine.length / own.length : mine.length ? 1 : 0;
    return {
      businessId,
      disputes: mine.length,
      redemptions: own.length,
      rate,
      corrections: corrected.length,
      correctedAgorot: corrected.reduce((s, d) => s + d.billDiffAgorot, 0),
      avgBillAgorot: avg(own),
      peerAvgBillAgorot: avg(peers),
      flagged: mine.length >= FLAG_MIN_DISPUTES && rate >= FLAG_DISPUTE_RATE,
    };
  });
}
