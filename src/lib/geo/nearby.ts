import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Point } from "./distance";

/**
 * Active businesses within radiusMeters of a point (storefront or any branch), nearest first: id → meters.
 * The one entry point for radius features (feed, map, later: "deals near you" pushes, a business's reach).
 */
export async function nearbyBusinesses(db: SupabaseClient, at: Point, radiusMeters: number, categoryId: string | null = null): Promise<Map<string, number>> {
  const { data, error } = await db.rpc("nearby_businesses", { lat: at.lat, lng: at.lng, radius_meters: radiusMeters, category_id: categoryId });
  if (error) throw error;
  return new Map((data as { business_id: string; distance_meters: number }[]).map((r) => [r.business_id, r.distance_meters]));
}
