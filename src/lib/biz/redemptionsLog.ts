import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toCsv } from "@/lib/admin/csv";
import { emailsOf } from "./cashiers";

/** One redemption in the owner's log (agorot). */
export interface BizRedemption {
  id: string;
  redeemedAt: string;
  status: "redeemed" | "voided";
  apartment: string;
  building: string;
  customer: string;
  /** Cashier's email, or "קופה" for the staff PIN terminal. */
  cashier: string;
  billAgorot: number;
  discountAgorot: number;
  paidAgorot: number;
  commissionAgorot: number;
  voidReason: string | null;
  /** The bill the register recorded, when Lobby later corrected it after a resident's report (the amounts above are the corrected ones). */
  correctedFromAgorot: number | null;
}

/** Totals over the non-voided redemptions in the filter. */
export interface BizTotals {
  redemptions: number;
  apartments: number;
  billAgorot: number;
  discountAgorot: number;
  commissionAgorot: number;
}

export interface BizLogFilters {
  from: string | null;
  to: string | null;
  /** A cashier's user id, "terminal" (staff PIN terminal) or null for everyone. */
  cashier: string | null;
}

interface Row {
  id: string; redeemed_at: string; status: "redeemed" | "voided"; cashier_user_id: string | null; void_reason: string | null;
  bill_agorot: number; discount_agorot: number; paid_agorot: number; commission_agorot: number;
  residents: { name: string | null } | null; apartments: { apartment_number: string; buildings: { name: string | null; address: string } };
  redemption_disputes: { status: string; original_bill_agorot: number } | null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Reads the log filters from a URL, dropping anything malformed. */
export function parseBizLogFilters(url: URL): BizLogFilters {
  const p = url.searchParams;
  const day = (v: string | null) => (v && DAY.test(v) ? v : null);
  const cashier = p.get("cashier");
  return { from: day(p.get("from")), to: day(p.get("to")), cashier: cashier === "terminal" || (cashier && UUID.test(cashier)) ? cashier : null };
}

/** The business's redemptions in the filter (newest first, up to `limit`) and totals over the non-voided ones. */
export async function listBizRedemptions(db: SupabaseClient, businessId: string, f: BizLogFilters, limit: number): Promise<{ rows: BizRedemption[]; totals: BizTotals }> {
  let q = db
    .from("redemptions")
    .select("id, redeemed_at, status, cashier_user_id, void_reason, bill_agorot, discount_agorot, paid_agorot, commission_agorot, residents(name), apartments(apartment_number, buildings(name, address)), redemption_disputes(status, original_bill_agorot)")
    .eq("business_id", businessId)
    .order("redeemed_at", { ascending: false })
    .limit(limit);
  // Days are Israel calendar days; an hour of drift at the edges (summer/winter offset) is acceptable for a log filter.
  if (f.from) q = q.gte("redeemed_at", `${f.from}T00:00:00+03:00`);
  if (f.to) q = q.lte("redeemed_at", `${f.to}T23:59:59+02:00`);
  if (f.cashier === "terminal") q = q.is("cashier_user_id", null);
  else if (f.cashier) q = q.eq("cashier_user_id", f.cashier);
  const { data, error } = await q;
  if (error) throw error;
  const raw = data as unknown as Row[];

  const emails = await emailsOf(db, [...new Set(raw.flatMap((r) => (r.cashier_user_id ? [r.cashier_user_id] : [])))]);
  const rows = raw.map((r) => ({
    id: r.id, redeemedAt: r.redeemed_at, status: r.status, apartment: r.apartments.apartment_number,
    building: r.apartments.buildings.name ?? r.apartments.buildings.address, customer: r.residents?.name?.trim().split(/\s+/)[0] || "—",
    cashier: r.cashier_user_id ? (emails.get(r.cashier_user_id) ?? "קופאי/ת") : "קופה", billAgorot: r.bill_agorot, discountAgorot: r.discount_agorot,
    paidAgorot: r.paid_agorot, commissionAgorot: r.commission_agorot, voidReason: r.void_reason,
    // Only the outcome reaches the business: never the resident's report, note or photo.
    correctedFromAgorot: r.redemption_disputes?.status === "CORRECTED" ? r.redemption_disputes.original_bill_agorot : null,
  }));
  const live = rows.filter((r) => r.status === "redeemed");
  const sum = (k: "billAgorot" | "discountAgorot" | "commissionAgorot") => live.reduce((s, r) => s + r[k], 0);
  return {
    rows,
    totals: {
      redemptions: live.length, apartments: new Set(live.map((r) => `${r.building}|${r.apartment}`)).size,
      billAgorot: sum("billAgorot"), discountAgorot: sum("discountAgorot"), commissionAgorot: sum("commissionAgorot"),
    },
  };
}

const israelTime = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" });
const shekels = (agorot: number) => agorot / 100;

/** The log as CSV (Hebrew headers, Israel times, shekel amounts). */
export function bizRedemptionsCsv(rows: BizRedemption[]): string {
  return toCsv(
    ["תאריך", "סטטוס", "בניין", "דירה", "לקוח", "קופה", "חשבון", "הנחה", "שולם", "עמלה", "סיבת ביטול"],
    rows.map((r) => [
      israelTime.format(new Date(r.redeemedAt)), r.status === "voided" ? "בוטל" : "מומש", r.building, r.apartment, r.customer, r.cashier,
      shekels(r.billAgorot), shekels(r.discountAgorot), shekels(r.paidAgorot), shekels(r.commissionAgorot), r.voidReason,
    ]),
  );
}
