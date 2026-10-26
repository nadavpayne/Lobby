import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BusinessStatus } from "@/lib/businesses/types";
import type { BuildingStage } from "./validate";

export interface MapBuilding {
  id: string;
  name: string | null;
  address: string;
  city: string;
  lat: number;
  lng: number;
  pipeline: BuildingStage;
}

export interface MapBusiness {
  id: string;
  name: string;
  category: string;
  city: string | null;
  status: BusinessStatus;
  lat: number;
  lng: number;
}

/** Billable Google calls this month, by kind. */
export interface GoogleUsage {
  autocomplete: number;
  placeDetails: number;
  textSearch: number;
}

export interface AdminMap {
  buildings: MapBuilding[];
  businesses: MapBusiness[];
  usage: GoogleUsage;
}

/** Calls of one kind since the start of this month (UTC). */
async function monthCount(db: SupabaseClient, sku: string): Promise<number> {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count, error } = await db.from("google_api_log").select("id", { count: "exact", head: true }).eq("sku", sku).gte("created_at", start.toISOString());
  if (error) throw error;
  return count ?? 0;
}

/** Every building and business that has a location (demo ones excluded), and this month's Google usage. */
export async function getAdminMap(db: SupabaseClient): Promise<AdminMap> {
  const [buildings, businesses, autocomplete, placeDetails, textSearch] = await Promise.all([
    db.from("buildings").select("id, name, address, city, lat, lng, pipeline").eq("is_demo", false).not("lat", "is", null).not("lng", "is", null),
    db.from("businesses").select("id, name, category, city, status, lat, lng").eq("is_demo", false).not("lat", "is", null).not("lng", "is", null),
    monthCount(db, "autocomplete"),
    monthCount(db, "place_details"),
    monthCount(db, "text_search"),
  ]);
  if (buildings.error) throw buildings.error;
  if (businesses.error) throw businesses.error;
  return {
    buildings: buildings.data as MapBuilding[],
    businesses: businesses.data as MapBusiness[],
    usage: { autocomplete, placeDetails, textSearch },
  };
}
