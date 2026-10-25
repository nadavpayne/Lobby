import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership } from "./membership";
import type { PendingMember } from "./types";

export type Decision = "approve" | "reject";

interface Row {
  id: string;
  name: string | null;
  created_at: string;
  apartments: { id: string; apartment_number: string; building_id: string };
}

const COLUMNS = "id, name, created_at, apartments!inner(id, apartment_number, building_id)";

/** Pending phones this member may decide on: the committee sees the whole building, a resident their own apartment. */
export async function listPending(db: SupabaseClient, m: Membership): Promise<PendingMember[]> {
  let query = db.from("residents").select(COLUMNS).eq("status", "pending").order("created_at");
  query = m.role === "committee" ? query.eq("apartments.building_id", m.building.id) : query.eq("apartment_id", m.apartmentId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    residentId: r.id,
    name: r.name,
    apartmentNumber: r.apartments.apartment_number,
    requestedAt: r.created_at,
  }));
}

/**
 * Approves (→ active) or rejects (→ removed from the apartment, free to join again) a pending phone.
 * Allowed for the building's committee, or for the active phone already in that apartment.
 * Returns false if the request doesn't exist, is no longer pending, or isn't this member's to decide.
 */
export async function decidePending(db: SupabaseClient, m: Membership, deciderId: string, residentId: string, decision: Decision): Promise<boolean> {
  const { data: target, error } = await db
    .from("residents")
    .select(COLUMNS)
    .eq("id", residentId)
    .eq("status", "pending")
    .maybeSingle<Row>();
  if (error) throw error;
  if (!target) return false;
  const allowed =
    m.role === "committee" ? target.apartments.building_id === m.building.id : target.apartments.id === m.apartmentId;
  if (!allowed) return false;

  // The status filter makes a second click (or a second decider) a no-op.
  const result =
    decision === "approve"
      ? await db.from("residents").update({ status: "active", approved_by: deciderId }).eq("id", residentId).eq("status", "pending").select("id")
      : await db.from("residents").delete().eq("id", residentId).eq("status", "pending").select("id");
  if (result.error) throw result.error;
  return result.data.length === 1;
}
