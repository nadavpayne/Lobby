import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "@/lib/buildings/membership";
import { listOffers } from "./listOffers";
import type { Feed, FeedBanner, FeedCategory } from "./types";

/** Active categories in display order. */
async function listCategories(db: SupabaseClient): Promise<FeedCategory[]> {
  const { data, error } = await db.from("categories").select("slug, name, icon").eq("active", true).order("sort");
  if (error) throw error;
  return data;
}

/** Active operator banners for the city (or for every city), in order. */
async function listBanners(db: SupabaseClient, city: string): Promise<FeedBanner[]> {
  const { data, error } = await db
    .from("banners")
    .select("id, title, subtitle, image_url, business_id, city")
    .eq("active", true)
    .order("sort");
  if (error) throw error;
  return data
    .filter((b) => b.city === null || b.city === city)
    .map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, imageUrl: b.image_url, businessId: b.business_id }));
}

/** What the apartment has saved since it joined (all redeemed discounts). */
async function savedTotal(db: SupabaseClient, apartmentId: string): Promise<number> {
  const { data, error } = await db.from("redemptions").select("discount_amount").eq("apartment_id", apartmentId).eq("status", "redeemed");
  if (error) throw error;
  return Math.round(data.reduce((sum, r) => sum + Number(r.discount_amount ?? 0), 0) * 100) / 100;
}

/** The resident home feed: offers with my state, banners, category chips (only ones with offers), my savings. */
export async function getFeed(db: SupabaseClient, m: Membership, userId: string): Promise<Feed> {
  const [offers, banners, categories, saved] = await Promise.all([
    listOffers(db, m, userId),
    m.building.isDemo ? Promise.resolve([]) : listBanners(db, m.building.city),
    listCategories(db),
    savedTotal(db, m.apartmentId),
  ]);
  const used = new Set(offers.map((o) => o.category));
  // A banner pointing at a business this building can't see would open "not found"; drop the link.
  const visible = new Set(offers.map((o) => o.businessId));
  return {
    offers,
    banners: banners.map((b) => (b.businessId && !visible.has(b.businessId) ? { ...b, businessId: null } : b)),
    categories: categories.filter((c) => used.has(c.slug)),
    savedTotal: saved,
    home: m.building.lat !== null && m.building.lng !== null ? { lat: m.building.lat, lng: m.building.lng } : null,
    radiusMeters: m.radiusMeters,
  };
}
