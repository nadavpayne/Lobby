// One-time: finds a Google place for every building, business and branch that has none, saves the normalized
// address + location, and lists the rows that failed so they can be fixed by hand (in the admin forms).
// Run after the address_geo migration, with GOOGLE_MAPS_SERVER_KEY set:
//   node --env-file=.env.local scripts/backfill-geo.ts
import { createClient } from "@supabase/supabase-js";
import { googleAddressProvider } from "../src/lib/address/google.ts";
import { addressProblem, placeColumns } from "../src/lib/address/rules.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const mapsKey = process.env.GOOGLE_MAPS_SERVER_KEY;
if (!url || !key || !mapsKey) throw new Error("Needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and GOOGLE_MAPS_SERVER_KEY");

const db = createClient(url, key, { auth: { persistSession: false } });
const google = googleAddressProvider(mapsKey);
const failed: string[] = [];
let fixed = 0;

/** Logs one billable call, like the app does. */
const log = (sku: string) => db.from("google_api_log").insert({ sku });

for (const table of ["buildings", "businesses", "branches"]) {
  const { data: rows, error } = await db.from(table).select("id, address, city").is("place_id", null);
  if (error) throw error;
  for (const row of rows as { id: string; address: string; city: string | null }[]) {
    const text = [row.address, row.city].filter(Boolean).join(", ");
    try {
      const placeId = await google.findPlaceId(text);
      await log("text_search");
      if (!placeId) throw new Error("לא נמצאה כתובת");
      const place = await google.resolve(placeId);
      await log("place_details");
      const problem = addressProblem(place);
      if (problem) throw new Error(problem);
      const { error: saveError } = await db.from(table).update(placeColumns(place)).eq("id", row.id);
      if (saveError) throw saveError;
      fixed++;
    } catch (e) {
      failed.push(`${table} ${row.id}  "${text}"  → ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

console.log(`Geocoded ${fixed} rows.`);
if (failed.length) console.log(`Fix these ${failed.length} by hand (pick the address again in the admin):\n${failed.join("\n")}`);
