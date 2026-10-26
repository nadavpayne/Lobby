import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlaceColumns } from "@/lib/address/resolve";
import type { BuildingData } from "./validateBuilding";

/**
 * Registers a building with apartments 1..N and makes the user its committee member, in their own apartment.
 * place: the picked address (null when address lookup is off: free text as typed).
 * Returns the invite slug, or { exists: true } if the building is already registered (same place, or same street + number + city).
 */
export async function createBuilding(
  db: SupabaseClient, userId: string, data: BuildingData, place: PlaceColumns | null = null,
): Promise<{ inviteSlug: string } | { exists: true }> {
  const address = place?.address ?? data.address;
  const city = place?.city ?? data.city;
  if (await buildingExists(db, address, city, place?.place_id)) return { exists: true };

  const { data: building, error } = await db
    .from("buildings")
    .insert({ ...place, address, city, apartment_count: data.apartmentCount, created_by: userId, committee_name: data.name })
    .select("id, invite_slug")
    .single<{ id: string; invite_slug: string }>();
  if (error?.code === "23505") return { exists: true }; // the same place was registered a moment ago
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

/** True if a building with this place ID, or this exact street + number + city, is already registered. */
export async function buildingExists(db: SupabaseClient, address: string, city: string, placeId?: string | null): Promise<boolean> {
  if (placeId) {
    const { data, error } = await db.from("buildings").select("id").eq("place_id", placeId).limit(1).maybeSingle();
    if (error) throw error;
    if (data) return true;
  }
  const { data, error } = await db.from("buildings").select("id").eq("address", address).eq("city", city).limit(1).maybeSingle();
  if (error) throw error;
  return !!data;
}
