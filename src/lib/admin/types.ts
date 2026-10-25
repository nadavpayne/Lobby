import type { BusinessStatus } from "../businesses/types.ts";

/** An offer as the admin reviews it. */
export interface AdminOffer {
  id: string;
  title: string;
  description: string;
  terms: string | null;
  discountPercent: number;
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
  /** Contract rate (default 5%). */
  commissionPercent: number;
  isDemo: boolean;
  createdAt: string;
  verifyUrl: string;
  offers: AdminOffer[];
}
