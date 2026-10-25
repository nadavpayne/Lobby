import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";

/** Commission owed by one business for one month. */
export interface BillingLine {
  businessId: string;
  business: string;
  period: string;
  redemptions: number;
  gmv: number;
  commission: number;
  status: "current" | "open" | "paid";
  paidAt: string | null;
}

/** Every business × month with redeemed purchases (demo excluded), newest month first, with payment status. */
export async function listBillingLines(db: SupabaseClient): Promise<BillingLine[]> {
  const [months, invoices, businesses] = await Promise.all([
    db.from("commissions_monthly").select("business_id, period, redemptions, gmv, commission_total"),
    db.from("invoices").select("business_id, period, status, paid_at"),
    db.from("businesses").select("id, name").eq("is_demo", false),
  ]);
  for (const r of [months, invoices, businesses]) if (r.error) throw r.error;

  const name = new Map(businesses.data!.map((b) => [b.id as string, b.name as string]));
  const invoice = new Map(invoices.data!.map((i) => [`${i.business_id}|${i.period}`, i]));
  const now = currentPeriod();
  return months.data!
    .filter((m) => name.has(m.business_id))
    .map((m) => {
      const inv = invoice.get(`${m.business_id}|${m.period}`);
      return {
        businessId: m.business_id, business: name.get(m.business_id)!, period: m.period, redemptions: m.redemptions,
        gmv: Number(m.gmv), commission: Number(m.commission_total),
        status: m.period === now ? "current" : inv?.status === "paid" ? "paid" : "open",
        paidAt: inv?.paid_at ?? null,
      } satisfies BillingLine;
    })
    .sort((a, b) => b.period.localeCompare(a.period) || b.commission - a.commission);
}

/** Marks a finished month as paid (or back to unpaid), creating its invoice row with the month's total if needed. */
export async function setPaid(db: SupabaseClient, businessId: string, period: string, paid: boolean): Promise<boolean> {
  if (period >= currentPeriod()) return false; // the running month can't be settled yet
  const { data: month, error } = await db
    .from("commissions_monthly")
    .select("commission_total")
    .eq("business_id", businessId)
    .eq("period", period)
    .maybeSingle<{ commission_total: number }>();
  if (error) throw error;
  if (!month) return false;
  const res = await db.from("invoices").upsert(
    { business_id: businessId, period, commission_total: month.commission_total, status: paid ? "paid" : "open", paid_at: paid ? new Date().toISOString() : null },
    { onConflict: "business_id,period" },
  );
  if (res.error) throw res.error;
  return true;
}
