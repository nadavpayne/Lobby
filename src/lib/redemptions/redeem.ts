import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calcRedemption } from "./money";
import type { RedeemResult } from "./types";
import { lookupCode } from "./verify";

/** Redeems a valid code with the full pre-discount bill. Single use: the update only matches a still-issued, unexpired row. */
export async function redeemCode(db: SupabaseClient, businessId: string, code: string, amount: number): Promise<RedeemResult> {
  const { row, result } = await lookupCode(db, businessId, code);
  if (result.status !== "valid") return result;

  const amounts = calcRedemption(amount, result.discountPercent, result.commissionPercent);
  const now = new Date().toISOString();
  const { data: updated, error } = await db
    .from("redemptions")
    .update({
      status: "redeemed",
      redeemed_at: now,
      amount: amounts.amount,
      discount_amount: amounts.discountAmount,
      commission_amount: amounts.commissionAmount,
    })
    .eq("id", row!.id) // a valid result always has its row
    .eq("status", "issued")
    .gt("expires_at", now)
    .select("id")
    .maybeSingle();
  if (error) throw error;

  // Lost a race (another device redeemed it, or it just expired): report the current state.
  if (!updated) return (await lookupCode(db, businessId, code)).result as RedeemResult;
  return { status: "redeemed", discountPercent: result.discountPercent, ...amounts };
}
