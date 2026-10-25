import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RedeemedRow } from "./stats";

interface Row {
  redeemed_at: string;
  amount: number;
  commission_amount: number;
  resident_id: string | null;
  residents: { name: string | null } | null;
  apartments: { buildings: { name: string | null; address: string } };
}

/** A redeemed purchase with who came (first name) and from which building. */
export interface RedeemedWithName extends RedeemedRow {
  firstName: string;
}

/**
 * Every redeemed purchase at the business, newest first.
 * shortcut: loads all rows; move the sums into a SQL view once a business has tens of thousands of redemptions.
 */
export async function loadRedeemed(db: SupabaseClient, businessId: string): Promise<RedeemedWithName[]> {
  const { data, error } = await db
    .from("redemptions")
    .select("redeemed_at, amount, commission_amount, resident_id, residents(name), apartments(buildings(name, address))")
    .eq("business_id", businessId)
    .eq("status", "redeemed")
    .order("redeemed_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    redeemedAt: r.redeemed_at,
    amount: Number(r.amount),
    commission: Number(r.commission_amount),
    customerId: r.resident_id,
    building: r.apartments.buildings.name ?? r.apartments.buildings.address,
    firstName: r.residents?.name?.trim().split(/\s+/)[0] || "לקוח/ה", // first name only, as at the register
  }));
}
