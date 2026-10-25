export type DisputeReason = "BILL_HIGHER" | "DISCOUNT_NOT_GIVEN" | "OTHER";
export type DisputeStatus = "OPEN" | "IN_REVIEW" | "CORRECTED" | "DISMISSED";

export const DISPUTE_REASONS: DisputeReason[] = ["BILL_HIGHER", "DISCOUNT_NOT_GIVEN", "OTHER"];

/** What the resident sees about their report. */
export interface ResidentDispute {
  status: DisputeStatus;
  resolutionNote: string | null;
  originalBillAgorot: number;
}

/** One dispute in the admin queue. */
export interface AdminDisputeRow {
  id: string;
  status: DisputeStatus;
  reason: DisputeReason;
  createdAt: string;
  businessId: string;
  businessName: string;
  apartment: string;
  building: string;
  redeemedAt: string;
  recordedBillAgorot: number;
  claimedBillAgorot: number | null;
  hasPhoto: boolean;
}

/** The admin's detail view: the row plus note, photo, the redemption and the business's dispute history. */
export interface AdminDisputeDetail extends AdminDisputeRow {
  note: string | null;
  photoUrl: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  original: { billAgorot: number; discountAgorot: number; commissionAgorot: number };
  redemption: { status: "redeemed" | "voided"; discountRate: number; commissionRate: number; commissionBase: "gross" | "net"; period: string };
  history: { id: string; status: DisputeStatus; reason: DisputeReason; createdAt: string }[];
}

/** Per business, one month: how often residents dispute its amounts. */
export interface DisputeSignal {
  businessId: string;
  disputes: number;
  redemptions: number;
  rate: number;
  corrections: number;
  correctedAgorot: number;
  avgBillAgorot: number | null;
  peerAvgBillAgorot: number | null;
  flagged: boolean;
}

/** One corrected redemption as the business's statement lists it (no resident identity: apartment only). */
export interface StatementCorrection {
  /** The month whose charge this correction lands in. */
  period: string;
  redeemedAt: string;
  correctedAt: string;
  apartment: string;
  oldBillAgorot: number;
  newBillAgorot: number;
  oldCommissionAgorot: number;
  newCommissionAgorot: number;
}
