import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "@/lib/buildings/membership";
import { listOffers } from "./listOffers";
import type { Feed, FeedCategory } from "./types";

/** Active categories in display order. */
async function listCategories(db: SupabaseClient): Promise<FeedCategory[]> {
  const { data, error } = await db.from("categories").select("slug, name, icon").eq("active", true).order("sort");
  if (error) throw error;
  return data;
}

/** What the apartment has saved since it joined (all redeemed discounts). */
async function savedTotal(db: SupabaseClient, apartmentId: string): Promise<number> {
  const { data, error } = await db.from("redemptions").select("discount_amount").eq("apartment_id", apartmentId).eq("status", "redeemed");
  if (error) throw error;
  return Math.round(data.reduce((sum, r) => sum + Number(r.discount_amount ?? 0), 0) * 100) / 100;
}

/** The resident home feed: offers with my state, the category chips (only categories that have offers), my savings. */
export async function getFeed(db: SupabaseClient, m: Membership): Promise<Feed> {
  const [offers, categories, saved] = await Promise.all([listOffers(db, m), listCategories(db), savedTotal(db, m.apartmentId)]);
  const used = new Set(offers.map((o) => o.category));
  return { offers, categories: categories.filter((c) => used.has(c.slug)), savedTotal: saved };
}
