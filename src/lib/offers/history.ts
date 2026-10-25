import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { withinWindow } from "@/lib/disputes/rules";
import type { ResidentDispute } from "@/lib/disputes/types";
import { currentPeriod } from "@/lib/period";
import type { CodeHistory } from "./types";

interface Row {
  id: string;
  code: string;
  status: "redeemed" | "voided";
  redeemed_at: string;
  amount: number;
  discount_amount: number;
  bill_agorot: number;
  period: string;
  businesses: { name: string };
  redemption_disputes: { status: ResidentDispute["status"]; resolution_note: string | null; original_bill_agorot: number } | null;
}

/** The apartment's redemptions ("my benefits", newest first, last 100) and what it saved in total and this month. */
export async function codeHistory(db: SupabaseClient, apartmentId: string): Promise<CodeHistory> {
  const { data, error } = await db
    .from("redemptions")
    .select("id, code, status, redeemed_at, amount, discount_amount, bill_agorot, period, businesses(name), redemption_disputes(status, resolution_note, original_bill_agorot)")
    .eq("apartment_id", apartmentId)
    .order("redeemed_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = data as unknown as Row[];
  const period = currentPeriod();
  const now = new Date();
  // Voided redemptions stay in the list (marked) but never count as savings.
  const saved = (list: Row[]) => Math.round(list.reduce((sum, r) => sum + Number(r.discount_amount), 0) * 100) / 100;
  const redeemed = rows.filter((r) => r.status === "redeemed");
  return {
    items: rows.map((r) => {
      const d = r.redemption_disputes;
      return {
        id: r.id, code: r.code, businessName: r.businesses.name, status: r.status, redeemedAt: r.redeemed_at,
        amount: Number(r.amount), discountAmount: Number(r.discount_amount), billAgorot: r.bill_agorot,
        dispute: d && { status: d.status, resolutionNote: d.resolution_note, originalBillAgorot: d.original_bill_agorot },
        canReport: r.status === "redeemed" && !d && withinWindow(r.redeemed_at, now),
      };
    }),
    savedTotal: saved(redeemed),
    savedThisMonth: saved(redeemed.filter((r) => r.period === period)),
  };
}
