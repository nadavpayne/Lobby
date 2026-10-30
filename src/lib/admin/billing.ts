import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadAdjustments, type BusinessAdjustment } from "@/lib/disputes/billing";
import { buildStatement, type MonthTotals } from "@/lib/disputes/statement";
import { currentPeriod } from "@/lib/period";

/** Commission owed by one business for one month. */
export interface BillingLine {
  businessId: string;
  business: string;
  period: string;
  redemptions: number;
  /** Of which one-time benefits: new customers the business got through Lobby. */
  oneTimeRedemptions: number;
  gmv: number;
  /** What the month is charged, including corrections to earlier months carried into it. */
  commission: number;
  /** Corrections to earlier, already-charged months included in this charge (agorot). */
  adjustmentsAgorot: number;
  status: "current" | "open" | "paid";
  paidAt: string | null;
}

interface MonthRow {
  business_id: string;
  period: string;
  redemptions: number;
  one_time_redemptions: number;
  gmv: number;
  commission_total: number;
}

/** Each business's months as charged (late corrections counted once, in the month they were made). */
function statements(months: MonthRow[], adjustments: BusinessAdjustment[]) {
  const byBusiness = new Map<string, MonthTotals[]>();
  for (const m of months) {
    const list = byBusiness.get(m.business_id) ?? [];
    list.push({ period: m.period, redemptions: m.redemptions, gmv: Number(m.gmv), commission: Number(m.commission_total) });
    byBusiness.set(m.business_id, list);
  }
  for (const a of adjustments) if (!byBusiness.has(a.businessId)) byBusiness.set(a.businessId, []);
  return [...byBusiness].flatMap(([businessId, list]) =>
    buildStatement(list, adjustments.filter((a) => a.businessId === businessId)).map((m) => ({ businessId, ...m })),
  );
}

/** Every business × month with redeemed purchases (demo excluded), newest month first, with payment status. */
export async function listBillingLines(db: SupabaseClient): Promise<BillingLine[]> {
  const [months, invoices, businesses, adjustments] = await Promise.all([
    db.from("commissions_monthly").select("business_id, period, redemptions, one_time_redemptions, gmv, commission_total"),
    db.from("invoices").select("business_id, period, status, paid_at"),
    db.from("businesses").select("id, name").eq("is_demo", false),
    loadAdjustments(db),
  ]);
  for (const r of [months, invoices, businesses]) if (r.error) throw r.error;

  const name = new Map(businesses.data!.map((b) => [b.id as string, b.name as string]));
  const invoice = new Map(invoices.data!.map((i) => [`${i.business_id}|${i.period}`, i]));
  const oneTime = new Map((months.data as MonthRow[]).map((m) => [`${m.business_id}|${m.period}`, m.one_time_redemptions]));
  const now = currentPeriod();
  return statements(months.data as MonthRow[], adjustments)
    .filter((m) => name.has(m.businessId))
    .map((m) => {
      const inv = invoice.get(`${m.businessId}|${m.period}`);
      return {
        businessId: m.businessId, business: name.get(m.businessId)!, period: m.period, redemptions: m.redemptions,
        oneTimeRedemptions: oneTime.get(`${m.businessId}|${m.period}`) ?? 0, gmv: m.gmv, commission: m.charged, adjustmentsAgorot: m.adjustmentsAgorot,
        status: m.period === now ? "current" : inv?.status === "paid" ? "paid" : "open",
        paidAt: inv?.paid_at ?? null,
      } satisfies BillingLine;
    })
    .sort((a, b) => b.period.localeCompare(a.period) || b.commission - a.commission);
}

/** Marks a finished month as paid (or back to unpaid), creating its invoice row with the month's charge if needed. */
export async function setPaid(db: SupabaseClient, businessId: string, period: string, paid: boolean): Promise<boolean> {
  if (period >= currentPeriod()) return false; // the running month can't be settled yet
  const [months, adjustments] = await Promise.all([
    db.from("commissions_monthly").select("business_id, period, redemptions, gmv, commission_total").eq("business_id", businessId),
    loadAdjustments(db, businessId),
  ]);
  if (months.error) throw months.error;
  const month = statements(months.data as MonthRow[], adjustments).find((m) => m.period === period);
  if (!month) return false;
  const res = await db.from("invoices").upsert(
    { business_id: businessId, period, commission_total: month.charged, status: paid ? "paid" : "open", paid_at: paid ? new Date().toISOString() : null },
    { onConflict: "business_id,period" },
  );
  if (res.error) throw res.error;
  return true;
}
