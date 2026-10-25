import type { ResidentDispute } from "../disputes/types";
import type { WeekHours } from "./hours";

/** Where an offer stands for my apartment this month. "active" = a QR is live right now; "upcoming" = starts later. */
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
  /** Starred by the Lobby operator (drives "מומלצות"). */
  featured: boolean;
  /** Redeemed in the last 30 days, all buildings (drives "החמות ביותר"). */
  recentRedemptions: number;
  /** Left for this building when the offer has a quantity limit, else null. */
  remaining: number | null;
  state: OfferState;
  /** "YYYY-MM-01" when this month's benefit is used and renews. */
  renewsOn?: string;
}

/** A category chip. */
export interface FeedCategory {
  slug: string;
  name: string;
  icon: string;
}

/** A hero banner set by the Lobby operator. */
export interface FeedBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  /** Opens this business's page when tapped. */
  businessId: string | null;
}

/** Everything the resident home feed needs in one response. */
export interface Feed {
  offers: ResidentOffer[];
  /** Operator banners for my city; empty = show the hottest offers instead. */
  banners: FeedBanner[];
  categories: FeedCategory[];
  /** What my apartment saved since joining. */
  savedTotal: number;
}

/** One line in "my benefits" (voided = the business cancelled it). */
export interface CodeHistoryItem {
  /** The redemption's id (what an amount report refers to). */
  id: string;
  code: string;
  businessName: string;
  status: "redeemed" | "voided";
  redeemedAt: string;
  amount: number;
  discountAmount: number;
  billAgorot: number;
  /** The apartment's report about this redemption's amount, if any. */
  dispute: ResidentDispute | null;
  /** "הסכום לא נכון?" shows: redeemed, no report yet, still within the reporting window. */
  canReport: boolean;
}

export interface CodeHistory {
  items: CodeHistoryItem[];
  savedTotal: number;
  savedThisMonth: number;
}
