import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BuildingData } from "./validateBuilding";

/**
 * Registers a building with apartments 1..N and makes the user its committee member, in their own apartment.
 * Returns the invite slug, or { exists: true } if this exact address is already registered.
 */
export async function createBuilding(db: SupabaseClient, userId: string, data: BuildingData): Promise<{ inviteSlug: string } | { exists: true }> {
  // shortcut: exact-match duplicate check (addresses are whitespace-normalized); add a unique index or geocoding if duplicates appear
  const { data: existing, error: lookupError } = await db
    .from("buildings")
    .select("id")
    .eq("address", data.address)
    .eq("city", data.city)
    .limit(1)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return { exists: true };

  const { data: building, error } = await db
    .from("buildings")
    .insert({ address: data.address, city: data.city, apartment_count: data.apartmentCount, created_by: userId, committee_name: data.name })
    .select("id, invite_slug")
    .single<{ id: string; invite_slug: string }>();
  if (error) throw error;

  try {
    const { data: apartments, error: aptError } = await db
      .from("apartments")
      .insert(Array.from({ length: data.apartmentCount }, (_, i) => ({ building_id: building.id, apartment_number: String(i + 1) })))
      .select("id, apartment_number");
    if (aptError) throw aptError;

    const own = apartments.find((a) => a.apartment_number === String(data.apartmentNumber));
    const { error: memberError } = await db
      .from("residents")
      .upsert({ id: userId, name: data.name, role: "committee", apartment_id: own!.id });
    if (memberError) throw memberError;
  } catch (e) {
    // supabase-js has no transactions: remove the half-created building (apartments cascade).
    await db.from("buildings").delete().eq("id", building.id);
    throw e;
  }

  return { inviteSlug: building.invite_slug };
}
