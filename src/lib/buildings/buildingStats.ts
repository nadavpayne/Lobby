import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";
import type { Membership } from "./membership";
import type { BuildingStats } from "./types";

/** Apartments joined, members, waiting phones, and this month's redemptions and savings for the building. */
export async function buildingStats(db: SupabaseClient, m: Membership): Promise<BuildingStats> {
  const [members, redeemed] = await Promise.all([
    db.from("residents").select("apartment_id, status, apartments!inner(building_id)").eq("apartments.building_id", m.building.id),
    db
      .from("redemptions")
      .select("discount_amount, apartments!inner(building_id)")
      .eq("apartments.building_id", m.building.id)
      .eq("status", "redeemed")
      .eq("period", currentPeriod()),
  ]);
  if (members.error) throw members.error;
  if (redeemed.error) throw redeemed.error;

  const active = members.data.filter((r) => r.status === "active");
  const saved = redeemed.data.reduce((sum, r) => sum + Number(r.discount_amount ?? 0), 0);
  return {
    apartmentsTotal: m.building.apartmentCount ?? 0,
    apartmentsJoined: new Set(active.map((r) => r.apartment_id)).size,
    members: active.length,
    redemptionsThisMonth: redeemed.data.length,
    savedThisMonth: Math.round(saved * 100) / 100,
  };
}
