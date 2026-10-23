import type { BusinessStatus } from "../businesses/types.ts";

/** A business as shown on the admin page. */
export interface AdminBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  contactName: string;
  phone: string;
  email: string;
  status: BusinessStatus;
  isDemo: boolean;
  createdAt: string;
  verifyUrl: string;
  offer: { discountPercent: number; description: string } | null;
}

/** Status changes the admin can make. */
export type StatusChange = "active" | "paused";
