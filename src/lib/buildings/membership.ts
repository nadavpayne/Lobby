import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberRole, MemberStatus } from "./types";

export interface Membership {
  role: MemberRole;
  status: MemberStatus;
  apartmentId: string;
  apartmentNumber: string;
  building: { id: string; address: string; city: string; apartmentCount: number | null; inviteSlug: string };
}

interface Row {
  role: MemberRole;
  status: MemberStatus;
  apartments: {
    id: string;
    apartment_number: string;
    buildings: { id: string; address: string; city: string; apartment_count: number | null; invite_slug: string };
  } | null;
}

/** The user's apartment, building and role, or null if they haven't joined a building. */
export async function getMembership(db: SupabaseClient, userId: string): Promise<Membership | null> {
  const { data, error } = await db
    .from("residents")
    .select("role, status, apartments(id, apartment_number, buildings(id, address, city, apartment_count, invite_slug))")
    .eq("id", userId)
    .maybeSingle<Row>();
  if (error) throw error;
  const apt = data?.apartments;
  if (!data || !apt) return null;
  const b = apt.buildings;
  return {
    role: data.role,
    status: data.status,
    apartmentId: apt.id,
    apartmentNumber: apt.apartment_number,
    building: { id: b.id, address: b.address, city: b.city, apartmentCount: b.apartment_count, inviteSlug: b.invite_slug },
  };
}
