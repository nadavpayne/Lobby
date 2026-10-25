import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Adjustment } from "./statement";
import type { StatementCorrection } from "./types";

/** A billing adjustment with its business (for statements across businesses). */
export interface BusinessAdjustment extends Adjustment {
  businessId: string;
}

/** Corrections to already-charged months, for one business or all of them. */
export async function loadAdjustments(db: SupabaseClient, businessId?: string): Promise<BusinessAdjustment[]> {
  let q = db.from("billing_adjustments").select("business_id, period, apply_period, commission_diff_agorot");
  if (businessId) q = q.eq("business_id", businessId);
  const { data, error } = await q;
  if (error) throw error;
  return data.map((a) => ({ businessId: a.business_id, period: a.period, applyPeriod: a.apply_period, commissionDiffAgorot: a.commission_diff_agorot }));
}

interface CorrectionRow {
  resolved_at: string; original_bill_agorot: number; original_commission_agorot: number;
  redemptions: { redeemed_at: string; period: string; bill_agorot: number; commission_agorot: number };
  apartments: { apartment_number: string };
  billing_adjustments: { apply_period: string }[] | { apply_period: string } | null;
}

/** Every corrected redemption of a business, filed under the month whose charge it changed. */
export async function loadCorrections(db: SupabaseClient, businessId: string): Promise<StatementCorrection[]> {
  const { data, error } = await db
    .from("redemption_disputes")
    .select("resolved_at, original_bill_agorot, original_commission_agorot, redemptions(redeemed_at, period, bill_agorot, commission_agorot), apartments(apartment_number), billing_adjustments(apply_period)")
    .eq("business_id", businessId)
    .eq("status", "CORRECTED")
    .order("resolved_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as CorrectionRow[]).map((c) => {
    const adj = Array.isArray(c.billing_adjustments) ? c.billing_adjustments[0] : c.billing_adjustments;
    return {
      period: adj?.apply_period ?? c.redemptions.period,
      redeemedAt: c.redemptions.redeemed_at,
      correctedAt: c.resolved_at,
      apartment: c.apartments.apartment_number,
      oldBillAgorot: c.original_bill_agorot,
      newBillAgorot: c.redemptions.bill_agorot,
      oldCommissionAgorot: c.original_commission_agorot,
      newCommissionAgorot: c.redemptions.commission_agorot,
    };
  });
}
