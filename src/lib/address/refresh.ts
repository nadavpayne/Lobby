import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logGoogleCall, underDailyCap } from "./resolve";
import type { AddressProvider } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
// Google lets us keep lat/lng for 30 days (place IDs forever): re-fetch after 25, and drop what we couldn't by 30.
const REFRESH_AFTER_MS = 25 * DAY_MS;
const KEEP_MAX_MS = 30 * DAY_MS;
// Leaves most of the daily Place Details cap for people picking addresses.
const MAX_PER_RUN = 150;

const TABLES = ["buildings", "businesses", "branches"] as const;

interface Row {
  id: string;
  place_id: string;
  geo_fetched_at: string | null;
  pin_moved?: boolean;
}

export interface RefreshReport {
  refreshed: number;
  dropped: number;
  failed: number;
  cacheCleared: number;
}

/**
 * The daily job: re-fetches coordinates older than 25 days by place ID (oldest first), clears coordinates that are
 * still stale at 30 days, and empties old cache rows. A pin the business owner dragged is their own data and stays.
 */
export async function refreshStaleLocations(db: SupabaseClient, provider: AddressProvider): Promise<RefreshReport> {
  const report: RefreshReport = { refreshed: 0, dropped: 0, failed: 0, cacheCleared: 0 };
  const now = Date.now();
  const staleBefore = new Date(now - REFRESH_AFTER_MS).toISOString();

  for (const table of TABLES) {
    const columns = table === "businesses" ? "id, place_id, geo_fetched_at, pin_moved" : "id, place_id, geo_fetched_at";
    const { data, error } = await db
      .from(table)
      .select(columns)
      .not("place_id", "is", null)
      .or(`geo_fetched_at.is.null,geo_fetched_at.lt.${staleBefore}`)
      .order("geo_fetched_at", { ascending: true, nullsFirst: true })
      .limit(MAX_PER_RUN);
    if (error) throw error;

    for (const row of data as unknown as Row[]) {
      if (row.pin_moved) {
        await db.from(table).update({ geo_fetched_at: new Date().toISOString() }).eq("id", row.id);
        continue;
      }
      const budgetLeft = report.refreshed + report.failed < MAX_PER_RUN && (await underDailyCap(db, "place_details"));
      try {
        if (!budgetLeft) throw new Error("no budget left today");
        const place = await provider.resolve(row.place_id);
        await logGoogleCall(db, "place_details");
        const { error: saveError } = await db.from(table).update({ lat: place.lat, lng: place.lng, geo_fetched_at: new Date().toISOString() }).eq("id", row.id);
        if (saveError) throw saveError;
        report.refreshed++;
      } catch (e) {
        report.failed++;
        if (budgetLeft) console.error(`geo refresh failed: ${table} ${row.id}`, e);
        // Past 30 days we may no longer keep Google's coordinates; the row keeps its place ID and gets them back next time.
        if (!row.geo_fetched_at || now - Date.parse(row.geo_fetched_at) > KEEP_MAX_MS) {
          await db.from(table).update({ lat: null, lng: null }).eq("id", row.id);
          report.dropped++;
        }
      }
    }
  }

  const { count } = await db.from("place_cache").delete({ count: "exact" }).lt("fetched_at", new Date(now - KEEP_MAX_MS).toISOString());
  report.cacheCleared = count ?? 0;
  return report;
}
