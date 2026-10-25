import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "@/lib/buildings/membership";
import { findBusinesses, liveOffer, remainingInBuilding } from "@/lib/offers/listOffers";
import { currentPeriod, nextPeriodStart } from "@/lib/period";
import { audit, qrSecret } from "./audit";
import { formatBackupCode, generateBackupCode } from "./backupCode";
import { signQr } from "./signing";
import type { IssuedToken, Receipt, TokenStatus } from "./types";

export type IssueOutcome = { ok: true; token: IssuedToken } | { ok: false; reason: "not_found" | "used" | "sold_out" };

interface TokenRow {
  id: string;
  backup_code: string;
  issued_at: string;
  expires_at: string;
}

/**
 * A fresh 5-minute token for this apartment at the business. Only one is active per apartment + business: issuing
 * replaces the previous one (the DB's partial unique index is the real guard against two phones racing).
 */
export async function issueToken(db: SupabaseClient, userId: string, m: Membership, businessId: string): Promise<IssueOutcome> {
  const [business] = await findBusinesses(db, m, businessId);
  const offer = business && liveOffer(business);
  if (!business || !offer) return { ok: false, reason: "not_found" };

  const { count, error } = await db
    .from("redemptions")
    .select("id", { count: "exact", head: true })
    .eq("apartment_id", m.apartmentId)
    .eq("business_id", business.id)
    .eq("period", currentPeriod())
    .eq("status", "redeemed");
  if (error) throw error;
  if (count) return { ok: false, reason: "used" };
  if ((await remainingInBuilding(db, offer, m.building.id)) === 0) return { ok: false, reason: "sold_out" };

  for (let attempt = 0; attempt < 5; attempt++) {
    const replaced = await db
      .from("redemption_tokens")
      .update({ status: "replaced" })
      .eq("apartment_id", m.apartmentId)
      .eq("business_id", business.id)
      .eq("status", "active");
    if (replaced.error) throw replaced.error;

    const { data, error: insertError } = await db
      .from("redemption_tokens")
      .insert({
        business_id: business.id, offer_id: offer.id, apartment_id: m.apartmentId, building_id: m.building.id,
        resident_id: userId, discount_rate: offer.discount_percent, backup_code: generateBackupCode(),
      })
      .select("id, backup_code, issued_at, expires_at")
      .single<TokenRow>();
    if (insertError?.code === "23505") continue; // another phone's token or a backup-code collision: replace and retry
    if (insertError) throw insertError;

    await audit(db, { event: "token_issued", businessId: business.id, tokenId: data.id, actorUserId: userId, details: { apartmentId: m.apartmentId } });
    return {
      ok: true,
      token: {
        tokenId: data.id, qr: signQr(data.id, new Date(data.expires_at), qrSecret()), backupCode: formatBackupCode(data.backup_code),
        issuedAt: data.issued_at, expiresAt: data.expires_at, businessName: business.name, discountRate: offer.discount_percent,
        apartmentNumber: m.apartmentNumber, period: currentPeriod(),
      },
    };
  }
  throw new Error("Could not issue a redemption token");
}

interface RedemptionRow {
  id: string;
  redeemed_at: string;
  bill_agorot: number;
  discount_agorot: number;
  paid_agorot: number;
  discount_rate: number;
  apartments: { apartment_number: string };
}

/** A redemption row → the receipt shown to residents and cashiers. */
export const toReceipt = (r: RedemptionRow): Receipt => ({
  redemptionId: r.id, redeemedAt: r.redeemed_at, billAgorot: r.bill_agorot, discountAgorot: r.discount_agorot,
  paidAgorot: r.paid_agorot, discountRate: Number(r.discount_rate), apartmentNumber: r.apartments.apartment_number,
});

export const RECEIPT_COLUMNS = "id, redeemed_at, bill_agorot, discount_agorot, paid_agorot, discount_rate, apartments(apartment_number)";

/** Where one of my apartment's tokens stands (the resident app polls this to move to the Done screen). Null if not mine. */
export async function tokenStatus(db: SupabaseClient, m: Membership, tokenId: string): Promise<TokenStatus | null> {
  const { data: t, error } = await db
    .from("redemption_tokens")
    .select("status, expires_at, redemption_id, businesses(name)")
    .eq("id", tokenId)
    .eq("apartment_id", m.apartmentId)
    .maybeSingle<{ status: "active" | "used" | "replaced"; expires_at: string; redemption_id: string | null; businesses: { name: string } }>();
  if (error) throw error;
  if (!t) return null;
  if (t.status === "replaced") return { status: "replaced" };
  if (t.status === "active") return { status: Date.parse(t.expires_at) <= Date.now() ? "expired" : "active" };

  const { data: r, error: rError } = await db.from("redemptions").select(RECEIPT_COLUMNS).eq("id", t.redemption_id!).single<RedemptionRow>();
  if (rError) throw rError;
  return { status: "used", receipt: toReceipt(r), businessName: t.businesses.name, renewsOn: nextPeriodStart(new Date(r.redeemed_at)) };
}
