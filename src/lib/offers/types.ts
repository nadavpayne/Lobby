/** Where an offer stands for my apartment this month. */
export type OfferState = "available" | "active" | "used" | "sold_out";

/** An offer as the resident app lists it. */
export interface ResidentOffer {
  businessId: string;
  businessName: string;
  category: string;
  address: string;
  discountPercent: number;
  description: string;
  terms: string | null;
  /** Left for this building when the offer has a quantity limit, else null. */
  remaining: number | null;
  state: OfferState;
  activeCode?: IssuedCode;
}

/** A live code to show at the register. */
export interface IssuedCode {
  code: string;
  expiresAt: string;
  businessName: string;
  discountPercent: number;
}

/** One line in "my codes". */
export interface CodeHistoryItem {
  code: string;
  businessName: string;
  status: "issued" | "redeemed" | "expired";
  issuedAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  amount: number | null;
  discountAmount: number | null;
}

export interface CodeHistory {
  items: CodeHistoryItem[];
  savedTotal: number;
  savedThisMonth: number;
}
