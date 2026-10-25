import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "@/lib/buildings/membership";
import { currentPeriod } from "@/lib/period";
import type { ResidentOffer } from "./types";

interface OfferRow {
  id: string;
  discount_percent: number;
  description: string;
  terms: string | null;
  quantity_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
}

export interface BusinessWithOffers {
  id: string;
  name: string;
  category: string;
  address: string;
  offers: OfferRow[];
}

/** Active businesses the building's residents may use: same city; demo buildings see only the demo business. */
export async function findBusinesses(db: SupabaseClient, m: Membership, businessId?: string): Promise<BusinessWithOffers[]> {
  let query = db
    .from("businesses")
    .select("id, name, category, address, offers(id, discount_percent, description, terms, quantity_limit, starts_at, ends_at, active)")
    .eq("status", "active")
    .eq("city", m.building.city)
    .eq("is_demo", m.building.isDemo)
    .order("name");
  if (businessId) query = query.eq("id", businessId);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as BusinessWithOffers[];
}

/** The business's offer that is switched on and inside its dates right now, if any. */
export function liveOffer(business: BusinessWithOffers, now = new Date()): OfferRow | undefined {
  return business.offers.find(
    (o) => o.active && (!o.starts_at || new Date(o.starts_at) <= now) && (!o.ends_at || new Date(o.ends_at) > now),
  );
}

/** How many of a quantity-limited offer are left for this building (issued + redeemed count against it). */
export async function remainingInBuilding(db: SupabaseClient, offer: OfferRow, buildingId: string): Promise<number | null> {
  if (!offer.quantity_limit) return null;
  const { count, error } = await db
    .from("redemptions")
    .select("id, apartments!inner(building_id)", { count: "exact", head: true })
    .eq("offer_id", offer.id)
    .in("status", ["issued", "redeemed"])
    .eq("apartments.building_id", buildingId);
  if (error) throw error;
  return Math.max(0, offer.quantity_limit - (count ?? 0));
}

/** Marks this apartment's codes past their 24h as expired, so the monthly slot frees up immediately. */
export async function expireStaleForApartment(db: SupabaseClient, apartmentId: string): Promise<void> {
  const { error } = await db
    .from("redemptions")
    .update({ status: "expired" })
    .eq("apartment_id", apartmentId)
    .eq("status", "issued")
    .lte("expires_at", new Date().toISOString());
  if (error) throw error;
}

/** Offers for the member's building, each with this month's state for their apartment. */
export async function listOffers(db: SupabaseClient, m: Membership): Promise<ResidentOffer[]> {
  await expireStaleForApartment(db, m.apartmentId);
  const [businesses, mine] = await Promise.all([
    findBusinesses(db, m),
    db
      .from("redemptions")
      .select("business_id, code, status, expires_at")
      .eq("apartment_id", m.apartmentId)
      .eq("period", currentPeriod())
      .in("status", ["issued", "redeemed"]),
  ]);
  if (mine.error) throw mine.error;

  const offers: ResidentOffer[] = [];
  for (const b of businesses) {
    const offer = liveOffer(b);
    if (!offer) continue;
    const used = mine.data.find((r) => r.business_id === b.id);
    const remaining = await remainingInBuilding(db, offer, m.building.id);
    offers.push({
      businessId: b.id,
      businessName: b.name,
      category: b.category,
      address: b.address,
      discountPercent: offer.discount_percent,
      description: offer.description,
      terms: offer.terms,
      remaining,
      state: used ? (used.status === "issued" ? "active" : "used") : remaining === 0 ? "sold_out" : "available",
      ...(used?.status === "issued" && {
        activeCode: { code: used.code, expiresAt: used.expires_at, businessName: b.name, discountPercent: offer.discount_percent },
      }),
    });
  }
  return offers;
}
