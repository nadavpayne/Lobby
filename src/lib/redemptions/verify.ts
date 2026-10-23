import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { VerifyResult } from "./types";

interface RedemptionRow {
  id: string;
  status: "issued" | "redeemed" | "expired";
  expires_at: string;
  redeemed_at: string | null;
  offers: { discount_percent: number };
  residents: { name: string | null } | null;
  apartments: { buildings: { address: string; city: string } };
}

export interface CodeLookup {
  row: RedemptionRow | null;
  result: VerifyResult;
}

/** Finds this business's redemption by code and classifies it (valid / used / expired / invalid). */
export async function lookupCode(db: SupabaseClient, businessId: string, code: string): Promise<CodeLookup> {
  const { data: row, error } = await db
    .from("redemptions")
    .select("id, status, expires_at, redeemed_at, offers(discount_percent), residents(name), apartments(buildings(address, city))")
    .eq("business_id", businessId)
    .eq("code", code)
    .maybeSingle<RedemptionRow>();
  if (error) throw error;
  if (!row) return { row, result: { status: "invalid" } };

  if (row.status === "redeemed") return { row, result: { status: "used", redeemedAt: row.redeemed_at! } };

  if (row.status === "expired" || new Date(row.expires_at) <= new Date()) {
    // Expire on read so the apartment can get a new code right away (the cron job is only a backstop).
    if (row.status === "issued") await db.from("redemptions").update({ status: "expired" }).eq("id", row.id).eq("status", "issued");
    return { row, result: { status: "expired" } };
  }

  const { address, city } = row.apartments.buildings;
  return {
    row,
    result: {
      status: "valid",
      discountPercent: row.offers.discount_percent,
      residentName: row.residents?.name?.trim().split(/\s+/)[0] || null, // first name only
      buildingAddress: `${address}, ${city}`,
    },
  };
}
