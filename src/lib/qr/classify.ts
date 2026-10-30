// The register's scan check, as a pure function (the server gathers the facts, this decides), in the spec's order.

import type { BenefitType } from "../benefits/types.ts";

export type ScanCode =
  | "OK"
  | "INVALID_CODE"
  | "WRONG_BUSINESS"
  | "CODE_EXPIRED"
  | "CODE_ALREADY_USED"
  | "ALREADY_REDEEMED_THIS_MONTH"
  | "ALREADY_REDEEMED_ONE_TIME";

export interface ScannedToken {
  businessId: string;
  status: "active" | "used" | "replaced";
  expiresAt: string;
  benefitType: BenefitType;
}

/**
 * Which result a scan gets: unknown/forged → INVALID_CODE; another business's code → WRONG_BUSINESS; past its 5 minutes
 * or replaced by a newer code → CODE_EXPIRED; redeemed within its 5 minutes → CODE_ALREADY_USED; the benefit's slot is
 * already taken (this month, or ever for a one-time benefit) → ALREADY_REDEEMED_THIS_MONTH / _ONE_TIME; else OK. Server time only.
 */
export function classifyScan(token: ScannedToken | null, businessId: string, alreadyRedeemed: boolean, now: Date): ScanCode {
  if (!token) return "INVALID_CODE";
  if (token.businessId !== businessId) return "WRONG_BUSINESS";
  if (token.status === "replaced" || Date.parse(token.expiresAt) <= now.getTime()) return "CODE_EXPIRED";
  if (token.status === "used") return "CODE_ALREADY_USED";
  if (alreadyRedeemed) return token.benefitType === "one_time" ? "ALREADY_REDEEMED_ONE_TIME" : "ALREADY_REDEEMED_THIS_MONTH";
  return "OK";
}
