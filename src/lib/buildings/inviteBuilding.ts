import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** What anyone holding the invite link may see about the building. */
export interface InviteBuilding {
  address: string;
  city: string;
  apartmentCount: number;
  active: boolean;
}

/** The building behind an invite slug, or null if the slug is malformed or unknown. */
export async function getBuildingByInvite(db: SupabaseClient, slug: string): Promise<InviteBuilding | null> {
  if (!/^[0-9a-f]{32}$/.test(slug)) return null;
  const { data, error } = await db
    .from("buildings")
    .select("address, city, apartment_count, active")
    .eq("invite_slug", slug)
    .maybeSingle<{ address: string; city: string; apartment_count: number | null; active: boolean }>();
  if (error) throw error;
  if (!data) return null;
  return { address: data.address, city: data.city, apartmentCount: data.apartment_count ?? 0, active: data.active };
}
