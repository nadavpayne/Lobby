import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaceColumns } from "@/lib/address/resolve";
import type { WeekHours } from "@/lib/offers/hours";
import { hashPin } from "@/lib/pin";
import type { BizProfile, ProfileInput } from "./types";

interface Row {
  name: string;
  category: string;
  description: string | null;
  phone: string;
  address: string;
  city: string | null;
  logo_url: string | null;
  hours: WeekHours | null;
  commission_percent: number;
  commission_base: "gross" | "net";
  access_slug: string;
  branches: { name: string; address: string; place_id: string | null }[];
}

/** The profile screen's data; terminalUrl is built from the request's host. */
export async function getProfile(db: SupabaseClient, businessId: string, origin: string): Promise<BizProfile> {
  const { data, error } = await db
    .from("businesses")
    .select("name, category, description, phone, address, city, logo_url, hours, commission_percent, commission_base, access_slug, branches(name, address, place_id)")
    .eq("id", businessId)
    .single<Row>();
  if (error) throw error;
  return {
    name: data.name,
    category: data.category,
    description: data.description,
    phone: data.phone,
    address: data.address,
    city: data.city,
    logoUrl: data.logo_url,
    hours: data.hours ?? {},
    branches: data.branches.map((b) => ({ name: b.name, address: b.address, ...(b.place_id && { placeId: b.place_id }) })),
    commissionPercent: Number(data.commission_percent),
    commissionBase: data.commission_base,
    terminalUrl: `${origin}/b/${data.access_slug}`,
  };
}

/**
 * Saves the editable details (not the logo: see saveLogo) and replaces the branch list (redemptions keep their history; branch_id is set null).
 * geo: the picked business address (null = unchanged) and each branch's place columns (null = typed text, no location).
 */
export async function saveProfile(
  db: SupabaseClient, businessId: string, p: ProfileInput, city: string | null,
  geo: { business: PlaceColumns | null; branches: (PlaceColumns | null)[] } = { business: null, branches: [] },
): Promise<void> {
  const res = await db
    .from("businesses")
    .update({ description: p.description, phone: p.phone, address: p.address, hours: p.hours, ...geo.business })
    .eq("id", businessId);
  if (res.error) throw res.error;
  const del = await db.from("branches").delete().eq("business_id", businessId);
  if (del.error) throw del.error;
  if (p.branches.length === 0) return;
  // Branches are in the business's city (offers are matched to buildings by city).
  const ins = await db.from("branches").insert(p.branches.map((b, i) => ({ name: b.name, address: b.address, business_id: businessId, city: city ?? "", ...geo.branches[i] })));
  if (ins.error) throw ins.error;
}

/** Sets a new staff terminal PIN. Device tokens are tied to the PIN hash, so every terminal must sign in again. */
export async function changeTerminalPin(db: SupabaseClient, businessId: string, pin: string): Promise<void> {
  const { error } = await db.from("businesses").update({ pin_hash: hashPin(pin) }).eq("id", businessId);
  if (error) throw error;
}

/** The stored location columns of this business's branches by place ID, so re-saving a branch needs no new Google lookup. */
export async function branchGeo(db: SupabaseClient, businessId: string): Promise<Map<string, PlaceColumns>> {
  const { data, error } = await db
    .from("branches")
    .select("address, city, lat, lng, place_id, street, house_number, postal_code, formatted_address, geo_fetched_at")
    .eq("business_id", businessId)
    .not("place_id", "is", null);
  if (error) throw error;
  return new Map((data as PlaceColumns[]).map((b) => [b.place_id, b]));
}
