import type { BenefitType, OneTimeScope } from "../benefits/types";
import type { ScanCode } from "./classify";

/** What the resident's phone shows: the QR, the backup code and the countdown. */
export interface IssuedToken {
  tokenId: string;
  qr: string;
  /** "HAP-PY7". */
  backupCode: string;
  issuedAt: string;
  expiresAt: string;
  businessName: string;
  discountRate: number;
  benefitType: BenefitType;
  oneTimeScope: OneTimeScope;
  apartmentNumber: string;
  /** "YYYY-MM" this benefit counts toward. */
  period: string;
}

/** A recorded redemption's receipt (agorot). */
export interface Receipt {
  redemptionId: string;
  redeemedAt: string;
  billAgorot: number;
  discountAgorot: number;
  paidAgorot: number;
  discountRate: number;
  benefitType: BenefitType;
  apartmentNumber: string;
}

/** The resident's token as the app polls it: still showing, dead, or redeemed (→ the Done screen). */
export type TokenStatus =
  | { status: "active" | "expired" | "replaced" }
  /** renewsOn: "YYYY-MM-01" for a monthly benefit; null for a one-time one (it doesn't come back). */
  | { status: "used"; receipt: Receipt; businessName: string; renewsOn: string | null };

/** The previous redemption, shown on the "already used" screen. */
export interface PreviousRedemption {
  redeemedAt: string;
  billAgorot: number;
  discountAgorot: number;
}

/** The register's scan result: the confirm screen's data, or which error screen to show. */
export type ScanResult =
  | {
      code: "OK"; scanId: string; apartmentNumber: string; discountRate: number; commissionRate: number; commissionBase: "gross" | "net";
      benefitType: BenefitType; oneTimeScope: OneTimeScope;
    }
  | { code: "ALREADY_REDEEMED_THIS_MONTH"; apartmentNumber: string; previous: PreviousRedemption; renewsOn: string }
  | { code: "ALREADY_REDEEMED_ONE_TIME"; apartmentNumber: string; previous: PreviousRedemption }
  | { code: "CODE_EXPIRED"; issuedAt: string | null; expiresAt: string | null }
  | { code: "CODE_ALREADY_USED"; usedAt: string | null }
  | { code: Extract<ScanCode, "INVALID_CODE" | "WRONG_BUSINESS"> };

/** The register's approve result. */
export type ApproveResult =
  | { code: "OK"; receipt: Receipt; commissionAgorot: number; replay: boolean }
  | { code: "ALREADY_REDEEMED_THIS_MONTH"; previous: PreviousRedemption | null; renewsOn: string }
  | { code: "ALREADY_REDEEMED_ONE_TIME"; previous: PreviousRedemption | null }
  | { code: "CODE_ALREADY_USED" | "CODE_EXPIRED" | "INVALID_CODE" | "INVALID_AMOUNT" };
