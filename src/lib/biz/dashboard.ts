import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRedeemed } from "./redeemed";
import { dashboardStats } from "./stats";
import type { BizDashboard } from "./types";

/** Unpaid invoice totals for the business. */
async function unpaidInvoices(db: SupabaseClient, businessId: string): Promise<number> {
  const { data, error } = await db.from("invoices").select("commission_total").eq("business_id", businessId).eq("status", "open");
  if (error) throw error;
  return data.reduce((s, r) => s + Number(r.commission_total), 0);
}

/** The business dashboard: windows, customers, daily series, top buildings and what it owes Lobby. */
export async function getDashboard(db: SupabaseClient, businessId: string): Promise<BizDashboard> {
  const [rows, unpaid] = await Promise.all([loadRedeemed(db, businessId), unpaidInvoices(db, businessId)]);
  const stats = dashboardStats(rows);
  return { ...stats, commissionOwed: Math.round((unpaid + stats.month.commission) * 100) / 100 };
}
