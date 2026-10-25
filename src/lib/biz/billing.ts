import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";
import type { BillingMonth } from "./types";

/** Monthly statement lines, newest first: redemptions, revenue and commission per month with invoice status. */
export async function listBilling(db: SupabaseClient, businessId: string): Promise<BillingMonth[]> {
  const [months, invoices] = await Promise.all([
    db.from("commissions_monthly").select("period, redemptions, gmv, commission_total").eq("business_id", businessId),
    db.from("invoices").select("period, status, paid_at").eq("business_id", businessId),
  ]);
  if (months.error) throw months.error;
  if (invoices.error) throw invoices.error;

  const invoiceOf = new Map(invoices.data.map((i) => [i.period as string, i]));
  const now = currentPeriod();
  return months.data
    .map((m) => {
      const invoice = invoiceOf.get(m.period);
      return {
        period: m.period,
        redemptions: m.redemptions,
        gmv: Number(m.gmv),
        commission: Number(m.commission_total),
        // A finished month without an invoice yet still counts as owed.
        status: m.period === now ? "current" : invoice?.status === "paid" ? "paid" : "open",
        paidAt: invoice?.paid_at ?? null,
      } satisfies BillingMonth;
    })
    .sort((a, b) => b.period.localeCompare(a.period));
}
