import type { WeekHours } from "./hours";

/** Where an offer stands for my apartment this month. "upcoming" = approved but starts later. */
export type OfferState = "available" | "active" | "used" | "sold_out" | "upcoming";

/** A business's benefit as the resident app shows it (feed cards and the business page). */
export interface ResidentOffer {
  businessId: string;
  businessName: string;
  category: string;
  address: string;
  businessDescription: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  lat: number | null;
  lng: number | null;
  hours: WeekHours | null;
  branches: { name: string; address: string }[];
  title: string;
  discountPercent: number;
  description: string;
  terms: string | null;
  startsAt: string | null;
  endsAt: string | null;
  /** When the business joined Lobby (drives "חדש בלובי"). */
  joinedAt: string;
  /** From my building; null when either address has no coordinates. */
  distanceMeters: number | null;
  /** Redeemed in the last 30 days, all buildings (drives "החמות ביותר"). */
  recentRedemptions: number;
  /** Left for this building when the offer has a quantity limit, else null. */
  remaining: number | null;
  state: OfferState;
  activeCode?: IssuedCode;
  /** "YYYY-MM-01" when this month's benefit is used and renews. */
  renewsOn?: string;
}

/** A category chip. */
export interface FeedCategory {
  slug: string;
  name: string;
  icon: string;
}

/** Everything the resident home feed needs in one response. */
export interface Feed {
  offers: ResidentOffer[];
  categories: FeedCategory[];
  /** What my apartment saved since joining. */
  savedTotal: number;
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
