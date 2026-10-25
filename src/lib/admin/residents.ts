import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** A resident row in the admin's residents screen. */
export interface AdminResident {
  id: string;
  name: string | null;
  phone: string | null;
  role: "resident" | "committee";
  status: "active" | "pending" | "blocked";
  building: string;
  buildingId: string;
  apartment: string;
  joinedAt: string;
  redemptions: number;
  lastRedemption: string | null;
}

interface Row {
  id: string;
  name: string | null;
  phone: string | null;
  role: AdminResident["role"];
  status: AdminResident["status"];
  created_at: string;
  apartments: { apartment_number: string; buildings: { id: string; name: string | null; address: string; is_demo: boolean } } | null;
}

const LIMIT = 200;

/** Residents (newest first, up to 200), optionally filtered by name/phone text or building, with their activity. */
export async function listResidents(db: SupabaseClient, q: string, buildingId: string | null): Promise<AdminResident[]> {
  let query = db
    .from("residents")
    .select("id, name, phone, role, status, created_at, apartments!inner(apartment_number, buildings!inner(id, name, address, is_demo))")
    .eq("apartments.buildings.is_demo", false)
    .order("created_at", { ascending: false })
    .limit(LIMIT);
  // Only letters, digits and spaces reach the filter, so the PostgREST or() syntax can't be broken.
  const term = q.replace(/[^\p{L}\p{N} ]/gu, "").trim();
  if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  if (buildingId) query = query.eq("apartments.buildings.id", buildingId);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data as unknown as Row[];

  const { data: used, error: usedError } = await db
    .from("redemptions")
    .select("resident_id, redeemed_at")
    .in("resident_id", rows.map((r) => r.id))
    .eq("status", "redeemed");
  if (usedError) throw usedError;
  const activity = new Map<string, { count: number; last: string }>();
  for (const u of used) {
    const a = activity.get(u.resident_id) ?? { count: 0, last: u.redeemed_at };
    a.count++;
    if (u.redeemed_at > a.last) a.last = u.redeemed_at;
    activity.set(u.resident_id, a);
  }

  return rows.map((r) => ({
    id: r.id, name: r.name, phone: r.phone, role: r.role, status: r.status,
    building: r.apartments!.buildings.name ?? r.apartments!.buildings.address, buildingId: r.apartments!.buildings.id,
    apartment: r.apartments!.apartment_number, joinedAt: r.created_at,
    redemptions: activity.get(r.id)?.count ?? 0, lastRedemption: activity.get(r.id)?.last ?? null,
  }));
}

/** Blocks or unblocks a resident. A blocked resident can't open the app or get codes. */
export async function setResidentStatus(db: SupabaseClient, id: string, status: "active" | "blocked"): Promise<boolean> {
  const { data, error } = await db.from("residents").update({ status }).eq("id", id).select("id").maybeSingle();
  if (error) throw error;
  return data !== null;
}
