import type { BenefitType, OneTimeScope } from "../benefits/types.ts";
import type { BusinessStatus } from "../businesses/types.ts";

/** An offer as the admin reviews it. */
export interface AdminOffer {
  id: string;
  title: string;
  description: string;
  terms: string | null;
  discountPercent: number;
  benefitType: BenefitType;
  oneTimeScope: OneTimeScope;
  active: boolean;
  approved: boolean;
  featured: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

/** A business as shown on the admin page. */
export interface AdminBusiness {
  id: string;
  name: string;
  /** The business's one photo (required at sign-up since the logo step was added). */
  logoUrl: string | null;
  category: string;
  address: string;
  city: string | null;
  contactName: string;
  phone: string;
  email: string;
  status: BusinessStatus;
  /** Contract rate and what it is computed on (the bill before or after the discount). */
  commissionPercent: number;
  commissionBase: "gross" | "net";
  isDemo: boolean;
  createdAt: string;
  verifyUrl: string;
  offers: AdminOffer[];
}
