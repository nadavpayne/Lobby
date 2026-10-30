import type { BenefitType, OneTimeScope } from "./types.ts";

/** What decides whether an apartment/resident may still use a benefit at a business. */
export interface Eligibility {
  benefitType: BenefitType;
  oneTimeScope: OneTimeScope;
  apartmentId: string;
  /** The resident's user id (resident-scope one-time benefits); null once the account is gone. */
  residentId: string | null;
  /** "YYYY-MM" of the scan (monthly benefits). */
  period: string;
}

/**
 * The redemption's eligibility key: unique per business among non-voided redemptions (the DB index), and built the
 * same way in approve_redemption(). Monthly: the apartment and month; one-time: the apartment, or the resident.
 */
export function eligibilityKey(e: Eligibility): string {
  if (e.benefitType === "monthly") return `apt:${e.apartmentId}:m:${e.period}`;
  if (e.oneTimeScope === "resident" && e.residentId) return `res:${e.residentId}:once`;
  return `apt:${e.apartmentId}:once`;
}
