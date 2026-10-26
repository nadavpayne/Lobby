import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { googleAddressProvider } from "./google";
import { addressProblem, placeColumns, validPin, type PlaceColumns } from "./rules";

export type { PlaceColumns };
import type { AddressProvider, ResolvedAddress } from "./types";

type Sku = "autocomplete" | "place_details";

// Our own daily caps, just under the Google Cloud quotas, so a burst gets a friendly error instead of a bill.
const DAILY_CAP: Record<Sku, number> = { autocomplete: 320, place_details: 290 };
// Google allows caching lat/lng for 30 days; re-fetch after 25.
const FRESH_MS = 25 * 24 * 60 * 60 * 1000;

/** The configured address provider, or null when address lookup is off (no key: forms take free text as before). */
export function getAddressProvider(): AddressProvider | null {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  return key ? googleAddressProvider(key) : null;
}

/** True while today's (UTC) billable calls of this kind are under our cap. */
export async function underDailyCap(db: SupabaseClient, sku: Sku): Promise<boolean> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count, error } = await db.from("google_api_log").select("id", { count: "exact", head: true }).eq("sku", sku).gte("created_at", since.toISOString());
  if (error) throw error;
  return (count ?? 0) < DAILY_CAP[sku];
}

/** Records one billable Google call. */
export async function logGoogleCall(db: SupabaseClient, sku: Sku | "text_search"): Promise<void> {
  const { error } = await db.from("google_api_log").insert({ sku });
  if (error) console.error("google_api_log insert failed", error);
}

/** A place's address: from our cache when fresh, otherwise one Place Details call (logged, then cached). */
export async function resolvePlace(db: SupabaseClient, provider: AddressProvider, placeId: string, sessionToken?: string): Promise<ResolvedAddress> {
  const { data: cached } = await db.from("place_cache").select("result, fetched_at").eq("place_id", placeId).maybeSingle<{ result: ResolvedAddress; fetched_at: string }>();
  if (cached && Date.now() - Date.parse(cached.fetched_at) < FRESH_MS) return cached.result;

  if (!(await underDailyCap(db, "place_details"))) throw new Error("place_details daily cap reached");
  const result = await provider.resolve(placeId, sessionToken);
  await logGoogleCall(db, "place_details");
  await db.from("place_cache").upsert({ place_id: placeId, result, fetched_at: new Date().toISOString() });
  return result;
}

export type FormAddress = { ok: true; columns: PlaceColumns | null } | { ok: false; error: string };

/**
 * Turns the placeId a form sent into DB columns. The browser never sends coordinates we trust: we resolve the
 * place ourselves (from cache, so it isn't billed twice). columns null = lookup is off, or optional and not sent.
 * withPin: accept the business owner's dragged pin when it's near the address.
 */
export async function addressFromForm(
  db: SupabaseClient,
  body: { placeId?: unknown; pin?: unknown },
  options: { required?: boolean; withPin?: boolean } = {},
): Promise<FormAddress> {
  const provider = getAddressProvider();
  if (!provider) return { ok: true, columns: null };
  const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
  if (!placeId) return options.required === false ? { ok: true, columns: null } : { ok: false, error: "נא להקליד כתובת ולבחור אותה מהרשימה" };
  if (placeId.length > 300) return { ok: false, error: "כתובת לא תקינה" };

  let address: ResolvedAddress;
  try {
    address = await resolvePlace(db, provider, placeId);
  } catch (e) {
    console.error("address resolve failed", e);
    return { ok: false, error: "לא הצלחנו לבדוק את הכתובת כרגע. נסו שוב בעוד רגע." };
  }
  const problem = addressProblem(address);
  if (problem) return { ok: false, error: problem };
  const pin = options.withPin ? validPin(address, body.pin) : null;
  return { ok: true, columns: { ...placeColumns(address, pin), ...(options.withPin && { pin_moved: pin !== null }) } };
}
