import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Point } from "@/lib/geo/distance";

/** Lobby households within one radius of the business. Counts only: never which buildings or apartments. */
export interface ReachRing {
  radiusMeters: number;
  buildings: number;
  apartments: number;
  residents: number;
}

export interface BizReach {
  /** The storefront on the map; null until the address was picked from the list. */
  location: Point | null;
  rings: ReachRing[];
}

const RINGS = [500, 1000];

/** Joined buildings, apartments and residents within 500 m and 1 km of the business's storefront. */
export async function getReach(db: SupabaseClient, businessId: string): Promise<BizReach> {
  const { data: b, error } = await db.from("businesses").select("lat, lng").eq("id", businessId).single<{ lat: number | null; lng: number | null }>();
  if (error) throw error;
  if (b.lat === null || b.lng === null) return { location: null, rings: [] };
  const location = { lat: b.lat, lng: b.lng };
  const rings = await Promise.all(
    RINGS.map(async (radiusMeters) => {
      const { data, error: countError } = await db.rpc("counts_near", { lat: b.lat, lng: b.lng, radius_meters: radiusMeters });
      if (countError) throw countError;
      const row = (data as Omit<ReachRing, "radiusMeters">[])[0];
      return { radiusMeters, ...row };
    }),
  );
  return { location, rings };
}
