import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";
import { expireStaleForApartment } from "./listOffers";
import type { CodeHistory } from "./types";

interface Row {
  code: string;
  status: "issued" | "redeemed" | "expired";
  issued_at: string;
  expires_at: string;
  redeemed_at: string | null;
  amount: number | null;
  discount_amount: number | null;
  period: string;
  businesses: { name: string };
}

/** The apartment's codes (newest first, last 100) and how much it saved in total and this month. */
export async function codeHistory(db: SupabaseClient, apartmentId: string): Promise<CodeHistory> {
  await expireStaleForApartment(db, apartmentId);
  const { data, error } = await db
    .from("redemptions")
    .select("code, status, issued_at, expires_at, redeemed_at, amount, discount_amount, period, businesses(name)")
    .eq("apartment_id", apartmentId)
    .order("issued_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = data as unknown as Row[];
  const period = currentPeriod();
  const saved = (list: Row[]) => Math.round(list.reduce((sum, r) => sum + Number(r.discount_amount ?? 0), 0) * 100) / 100;
  const redeemed = rows.filter((r) => r.status === "redeemed");
  return {
    items: rows.map((r) => ({
      code: r.code,
      businessName: r.businesses.name,
      status: r.status,
      issuedAt: r.issued_at,
      expiresAt: r.expires_at,
      redeemedAt: r.redeemed_at,
      amount: r.amount === null ? null : Number(r.amount),
      discountAmount: r.discount_amount === null ? null : Number(r.discount_amount),
    })),
    savedTotal: saved(redeemed),
    savedThisMonth: saved(redeemed.filter((r) => r.period === period)),
  };
}
