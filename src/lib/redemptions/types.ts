import type { RedemptionAmounts } from "./money";

/** Result of checking a code at the business terminal. */
export type VerifyResult =
  | { status: "valid"; discountPercent: number; commissionPercent: number; residentName: string | null; buildingAddress: string }
  | { status: "used"; redeemedAt: string }
  | { status: "expired" | "invalid" };

/** Result of confirming a redemption with the bill amount. */
export type RedeemResult =
  | ({ status: "redeemed"; discountPercent: number } & RedemptionAmounts)
  | { status: "used"; redeemedAt: string }
  | { status: "expired" | "invalid" };
