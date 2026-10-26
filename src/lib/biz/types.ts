import type { StatementCorrection } from "@/lib/disputes/types";
import type { WeekHours } from "@/lib/offers/hours";

/** Count and money for one time window. */
export interface WindowStats {
  redemptions: number;
  /** Full bills before discount, i.e. revenue Lobby brought in. */
  gmv: number;
  commission: number;
}

/** The business dashboard. */
export interface BizDashboard {
  today: WindowStats;
  week: WindowStats;
  month: WindowStats;
  /** Unpaid invoices plus this month's commission so far. */
  commissionOwed: number;
  /** This month's customers: first visit ever vs. came before. */
  newCustomers: number;
  returningCustomers: number;
  /** Last 30 days, oldest first. */
  daily: { date: string; redemptions: number }[];
  /** Buildings bringing the most redemptions in the last 90 days. */
  topBuildings: { name: string; redemptions: number }[];
}

/** One Lobby customer of the business. */
export interface Customer {
  residentId: string;
  firstName: string;
  building: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
  note: string;
  tags: string[];
}

/** What the owner fills in for an offer. */
export interface OfferInput {
  title: string;
  description: string;
  terms: string | null;
  discountPercent: number;
  category: string;
  /** "YYYY-MM-DD" or null = from now / no end. */
  startsOn: string | null;
  endsOn: string | null;
}

/** An offer as the owner sees it. */
export interface BizOffer extends OfferInput {
  id: string;
  active: boolean;
  /** false = waiting for Lobby to approve (residents don't see it yet). */
  approved: boolean;
  createdAt: string;
}

/** One month on the commission statement. */
export interface BillingMonth {
  period: string;
  redemptions: number;
  gmv: number;
  /** What the month is charged, including corrections to earlier months carried into it. */
  commission: number;
  /** Corrections to earlier, already-charged months included in this month's charge (agorot). */
  adjustmentsAgorot: number;
  /** Amount corrections (after a resident's report) that changed this month's charge. */
  corrections: StatementCorrection[];
  /** current = month still running; open = invoiced, unpaid; paid. */
  status: "current" | "open" | "paid";
  paidAt: string | null;
}

/** A branch address. */
export interface Branch {
  name: string;
  address: string;
  /** The branch's picked address (kept across saves so its map location survives). */
  placeId?: string;
}

/** What the owner can edit about the business. */
export interface ProfileInput {
  description: string | null;
  phone: string;
  address: string;
  hours: WeekHours;
  branches: Branch[];
  /** Set only when the owner picked a new business address; pin = where they dragged the storefront pin. */
  placeId?: string;
  pin?: { lat: number; lng: number } | null;
}

/** The business profile screen. */
export interface BizProfile extends ProfileInput {
  name: string;
  category: string;
  city: string | null;
  commissionPercent: number;
  /** The business's one photo (logo / profile picture); changed through the logo upload, not this form. */
  logoUrl: string | null;
  /** Link for staff phones/tablets at the register (PIN protected). */
  terminalUrl: string;
}
