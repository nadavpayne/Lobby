import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";
import type { CodeHistory } from "./types";

interface Row {
  code: string;
  status: "redeemed" | "voided";
  redeemed_at: string;
  amount: number;
  discount_amount: number;
  period: string;
  businesses: { name: string };
}

/** The apartment's redemptions ("my benefits", newest first, last 100) and what it saved in total and this month. */
export async function codeHistory(db: SupabaseClient, apartmentId: string): Promise<CodeHistory> {
  const { data, error } = await db
    .from("redemptions")
    .select("code, status, redeemed_at, amount, discount_amount, period, businesses(name)")
    .eq("apartment_id", apartmentId)
    .order("redeemed_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = data as unknown as Row[];
  const period = currentPeriod();
  // Voided redemptions stay in the list (marked) but never count as savings.
  const saved = (list: Row[]) => Math.round(list.reduce((sum, r) => sum + Number(r.discount_amount), 0) * 100) / 100;
  const redeemed = rows.filter((r) => r.status === "redeemed");
  return {
    items: rows.map((r) => ({
      code: r.code, businessName: r.businesses.name, status: r.status, redeemedAt: r.redeemed_at,
      amount: Number(r.amount), discountAmount: Number(r.discount_amount),
    })),
    savedTotal: saved(redeemed),
    savedThisMonth: saved(redeemed.filter((r) => r.period === period)),
  };
}
