import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberRole, MemberStatus } from "./types";

export interface Membership {
  role: MemberRole;
  status: MemberStatus;
  apartmentId: string;
  apartmentNumber: string;
  /** How far "near my building" reaches, in meters. */
  radiusMeters: number;
  building: {
    id: string; name: string | null; address: string; city: string; lat: number | null; lng: number | null; apartmentCount: number | null;
    inviteSlug: string; active: boolean; isDemo: boolean; committeeName: string | null; committeePhone: string | null;
  };
}

interface Row {
  role: MemberRole;
  status: MemberStatus;
  radius_preference: number;
  apartments: {
    id: string;
    apartment_number: string;
    buildings: {
      id: string; name: string | null; address: string; city: string; lat: number | null; lng: number | null; apartment_count: number | null;
      invite_slug: string; active: boolean; is_demo: boolean; committee_name: string | null; committee_phone: string | null;
    };
  } | null;
}

/** The user's apartment, building and role, or null if they haven't joined a building. */
export async function getMembership(db: SupabaseClient, userId: string): Promise<Membership | null> {
  const { data, error } = await db
    .from("residents")
    .select("role, status, radius_preference, apartments(id, apartment_number, buildings(id, name, address, city, lat, lng, apartment_count, invite_slug, active, is_demo, committee_name, committee_phone))")
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
    radiusMeters: data.radius_preference,
    building: {
      id: b.id, name: b.name, address: b.address, city: b.city, lat: b.lat, lng: b.lng, apartmentCount: b.apartment_count,
      inviteSlug: b.invite_slug, active: b.active, isDemo: b.is_demo, committeeName: b.committee_name, committeePhone: b.committee_phone,
    },
  };
}
