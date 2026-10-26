import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "@/lib/buildings/membership";
import { nearbyBusinesses } from "@/lib/geo/nearby";
import { currentPeriod, nextPeriodStart } from "@/lib/period";
import type { WeekHours } from "./hours";
import type { ResidentOffer } from "./types";

interface OfferRow {
  id: string;
  title: string | null;
  discount_percent: number;
  description: string;
  terms: string | null;
  quantity_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
  approved_at: string | null;
  featured: boolean;
}

export interface BusinessWithOffers {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  lat: number | null;
  lng: number | null;
  hours: WeekHours | null;
  created_at: string;
  offers: OfferRow[];
  branches: { name: string; address: string }[];
}

const RECENT_DAYS = 30;
// Distances are shown for every business in the city; the resident's own radius decides "near".
const DISTANCE_REACH_METERS = 50_000;

/** Active businesses the building's residents may use: same city; demo buildings see only the demo business. */
export async function findBusinesses(db: SupabaseClient, m: Membership, businessId?: string): Promise<BusinessWithOffers[]> {
  let query = db
    .from("businesses")
    .select(
      "id, name, category, address, description, logo_url, cover_url, lat, lng, hours, created_at, " +
        "offers(id, title, discount_percent, description, terms, quantity_limit, starts_at, ends_at, active, approved_at, featured), branches(name, address)",
    )
    .eq("status", "active")
    .eq("city", m.building.city)
    .eq("is_demo", m.building.isDemo)
    .order("name");
  if (businessId) query = query.eq("id", businessId);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as BusinessWithOffers[];
}

/** Switched on and approved by Lobby (residents never see an offer the operator hasn't approved). */
const usable = (o: OfferRow) => o.active && o.approved_at !== null;

/** The business's usable offer that is inside its dates right now, if any. */
export function liveOffer(business: BusinessWithOffers, now = new Date()): OfferRow | undefined {
  return business.offers.find(
    (o) => usable(o) && (!o.starts_at || new Date(o.starts_at) <= now) && (!o.ends_at || new Date(o.ends_at) > now),
  );
}

/** The business's next usable offer that hasn't started yet (for "נפתחות בקרוב"). */
function upcomingOffer(business: BusinessWithOffers, now = new Date()): OfferRow | undefined {
  return business.offers
    .filter((o) => usable(o) && o.starts_at && new Date(o.starts_at) > now)
    .sort((a, b) => Date.parse(a.starts_at!) - Date.parse(b.starts_at!))[0];
}

/** How many of a quantity-limited offer are left for this building (redemptions count against it). */
export async function remainingInBuilding(db: SupabaseClient, offer: OfferRow, buildingId: string): Promise<number | null> {
  if (!offer.quantity_limit) return null;
  const { count, error } = await db
    .from("redemptions")
    .select("id, apartments!inner(building_id)", { count: "exact", head: true })
    .eq("offer_id", offer.id)
    .eq("status", "redeemed")
    .eq("apartments.building_id", buildingId);
  if (error) throw error;
  return Math.max(0, offer.quantity_limit - (count ?? 0));
}

/** Redeemed count per business over the last 30 days, across all buildings. */
async function recentRedemptions(db: SupabaseClient, businessIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (businessIds.length === 0) return counts;
  // shortcut: counts rows in JS; move to a grouped view once a city has thousands of monthly redemptions.
  const { data, error } = await db
    .from("redemptions")
    .select("business_id")
    .in("business_id", businessIds)
    .eq("status", "redeemed")
    .gte("redeemed_at", new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString());
  if (error) throw error;
  for (const r of data) counts.set(r.business_id, (counts.get(r.business_id) ?? 0) + 1);
  return counts;
}

/** Live and upcoming offers for the member's building, each with this month's state for their apartment. */
export async function listOffers(db: SupabaseClient, m: Membership): Promise<ResidentOffer[]> {
  const [businesses, used, tokens] = await Promise.all([
    findBusinesses(db, m),
    db.from("redemptions").select("business_id").eq("apartment_id", m.apartmentId).eq("period", currentPeriod()).eq("status", "redeemed"),
    db.from("redemption_tokens").select("business_id").eq("apartment_id", m.apartmentId).eq("status", "active").gt("expires_at", new Date().toISOString()),
  ]);
  if (used.error) throw used.error;
  if (tokens.error) throw tokens.error;
  const usedAt = new Set(used.data.map((r) => r.business_id as string));
  const showingAt = new Set(tokens.data.map((t) => t.business_id as string));
  const home = m.building.lat !== null && m.building.lng !== null ? { lat: m.building.lat, lng: m.building.lng } : null;
  const [recent, distances] = await Promise.all([
    recentRedemptions(db, businesses.map((b) => b.id)),
    home ? nearbyBusinesses(db, home, DISTANCE_REACH_METERS) : Promise.resolve(new Map<string, number>()),
  ]);

  const offers: ResidentOffer[] = [];
  for (const b of businesses) {
    const live = liveOffer(b);
    const offer = live ?? upcomingOffer(b);
    if (!offer) continue;
    const remaining = live ? await remainingInBuilding(db, offer, m.building.id) : null;
    const state = !live ? "upcoming" : usedAt.has(b.id) ? "used" : showingAt.has(b.id) ? "active" : remaining === 0 ? "sold_out" : "available";

    offers.push({
      businessId: b.id,
      businessName: b.name,
      category: b.category,
      address: b.address,
      businessDescription: b.description,
      logoUrl: b.logo_url,
      coverUrl: b.cover_url,
      lat: b.lat,
      lng: b.lng,
      hours: b.hours,
      branches: b.branches,
      title: offer.title ?? `${offer.discount_percent}% הנחה`,
      discountPercent: offer.discount_percent,
      description: offer.description,
      terms: offer.terms,
      startsAt: offer.starts_at,
      endsAt: offer.ends_at,
      joinedAt: b.created_at,
      distanceMeters: distances.get(b.id) ?? null,
      withinRadius: (distances.get(b.id) ?? Infinity) <= m.radiusMeters,
      featured: offer.featured,
      recentRedemptions: recent.get(b.id) ?? 0,
      remaining,
      state,
      ...(state === "used" && { renewsOn: nextPeriodStart() }),
    });
  }
  return offers;
}
