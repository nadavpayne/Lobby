import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "@/lib/buildings/membership";
import { generateCode } from "@/lib/codes";
import { currentPeriod } from "@/lib/period";
import { expireStaleForApartment, findBusinesses, liveOffer, remainingInBuilding } from "./listOffers";
import type { IssuedCode } from "./types";

export type IssueOutcome = { ok: true; code: IssuedCode } | { ok: false; reason: "not_found" | "used" | "sold_out" };

/**
 * Issues this apartment's 6-digit code for the business, valid 10 minutes (DB default). One live-or-used code per apartment per business per
 * month (the DB's partial unique index is the real guard); asking again while a code is live returns that code.
 */
export async function issueCode(db: SupabaseClient, userId: string, m: Membership, businessId: string): Promise<IssueOutcome> {
  const [business] = await findBusinesses(db, m, businessId);
  const offer = business && liveOffer(business);
  if (!business || !offer) return { ok: false, reason: "not_found" };

  await expireStaleForApartment(db, m.apartmentId);
  const toIssued = (code: string, expiresAt: string): IssueOutcome => ({
    ok: true,
    code: { code, expiresAt, businessName: business.name, discountPercent: offer.discount_percent },
  });

  /** This month's live or redeemed code for the apartment at this business, if any. */
  const existing = async () => {
    const { data, error } = await db
      .from("redemptions")
      .select("code, status, expires_at")
      .eq("apartment_id", m.apartmentId)
      .eq("business_id", business.id)
      .eq("period", currentPeriod())
      .in("status", ["issued", "redeemed"])
      .maybeSingle<{ code: string; status: string; expires_at: string }>();
    if (error) throw error;
    return data;
  };

  const before = await existing();
  if (before) return before.status === "issued" ? toIssued(before.code, before.expires_at) : { ok: false, reason: "used" };
  if ((await remainingInBuilding(db, offer, m.building.id)) === 0) return { ok: false, reason: "sold_out" };

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await db
      .from("redemptions")
      .insert({ code: generateCode(), apartment_id: m.apartmentId, business_id: business.id, offer_id: offer.id, resident_id: userId })
      .select("code, expires_at")
      .single<{ code: string; expires_at: string }>();
    if (!error) return toIssued(data.code, data.expires_at);
    if (error.code !== "23505") throw error;
    if (error.message.includes("one_per_apartment")) {
      // Another phone in the apartment got it a moment ago.
      const now = await existing();
      return now?.status === "issued" ? toIssued(now.code, now.expires_at) : { ok: false, reason: "used" };
    }
    // Otherwise the random code already exists at this business: try another.
  }
  throw new Error("Could not generate a unique code");
}
