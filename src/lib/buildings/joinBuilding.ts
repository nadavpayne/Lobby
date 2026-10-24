import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemberStatus } from "./types";
import type { ResidentJoinData } from "./validateResidentJoin";

export type JoinOutcome =
  | { ok: true; status: MemberStatus }
  | { ok: false; reason: "not_found" | "inactive" | "no_apartment" | "full" };

/**
 * Puts the user in an apartment of the invited building. The DB trigger decides the status:
 * first phone in the apartment → active, second → pending approval, third → refused ("apartment_full").
 */
export async function joinBuilding(db: SupabaseClient, userId: string, inviteSlug: string, data: ResidentJoinData): Promise<JoinOutcome> {
  const { data: building, error } = await db
    .from("buildings")
    .select("id, active")
    .eq("invite_slug", inviteSlug)
    .maybeSingle<{ id: string; active: boolean }>();
  if (error) throw error;
  if (!building) return { ok: false, reason: "not_found" };
  if (!building.active) return { ok: false, reason: "inactive" };

  const { data: apartment, error: aptError } = await db
    .from("apartments")
    .select("id")
    .eq("building_id", building.id)
    .eq("apartment_number", String(data.apartmentNumber))
    .maybeSingle<{ id: string }>();
  if (aptError) throw aptError;
  if (!apartment) return { ok: false, reason: "no_apartment" };

  const { data: member, error: joinError } = await db
    .from("residents")
    .upsert({ id: userId, name: data.name, role: "resident", apartment_id: apartment.id })
    .select("status")
    .single<{ status: MemberStatus }>();
  if (joinError?.message.includes("apartment_full")) return { ok: false, reason: "full" };
  if (joinError) throw joinError;
  return { ok: true, status: member.status };
}
