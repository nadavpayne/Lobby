import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { currentPeriod } from "@/lib/period";

/** The operator's overview: totals and 6-month growth. */
export interface AdminOverview {
  activeBuildings: number;
  residents: number;
  activeBusinesses: number;
  pendingOffers: number;
  month: { redemptions: number; gmv: number; commission: number };
  allTime: { redemptions: number; gmv: number; commission: number; saved: number };
  /** Last 6 months, oldest first. */
  monthly: { period: string; redemptions: number; commission: number; newResidents: number }[];
}

/** The last n periods ("YYYY-MM"), oldest first. */
function lastPeriods(n: number): string[] {
  const [y, m] = currentPeriod().split("-").map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Totals across real (non-demo) buildings and businesses. */
export async function getOverview(db: SupabaseClient): Promise<AdminOverview> {
  const periods = lastPeriods(6);
  const [buildings, residents, businesses, pending, redeemed] = await Promise.all([
    db.from("buildings").select("id", { count: "exact", head: true }).eq("is_demo", false).eq("pipeline", "joined").eq("active", true),
    db.from("residents").select("created_at, apartments!inner(buildings!inner(is_demo))").eq("status", "active").eq("apartments.buildings.is_demo", false),
    db.from("businesses").select("id", { count: "exact", head: true }).eq("is_demo", false).eq("status", "active"),
    db.from("offers").select("id, businesses!inner(is_demo)", { count: "exact", head: true }).is("approved_at", null).eq("active", true).eq("businesses.is_demo", false),
    // shortcut: sums rows in JS; switch to a SQL view when there are hundreds of thousands of redemptions.
    db.from("redemptions").select("period, amount, discount_amount, commission_amount, businesses!inner(is_demo)").eq("status", "redeemed").eq("businesses.is_demo", false),
  ]);
  for (const r of [buildings, residents, businesses, pending, redeemed]) if (r.error) throw r.error;

  const round = (n: number) => Math.round(n * 100) / 100;
  const rows = redeemed.data as unknown as { period: string; amount: number; discount_amount: number; commission_amount: number }[];
  const total = (list: typeof rows) => ({
    redemptions: list.length,
    gmv: round(list.reduce((s, r) => s + Number(r.amount), 0)),
    commission: round(list.reduce((s, r) => s + Number(r.commission_amount), 0)),
  });
  const joinedIn = (period: string) => residents.data!.filter((r) => currentPeriod(new Date(r.created_at)) === period).length;

  return {
    activeBuildings: buildings.count ?? 0,
    residents: residents.data!.length,
    activeBusinesses: businesses.count ?? 0,
    pendingOffers: pending.count ?? 0,
    month: total(rows.filter((r) => r.period === currentPeriod())),
    allTime: { ...total(rows), saved: round(rows.reduce((s, r) => s + Number(r.discount_amount), 0)) },
    monthly: periods.map((p) => {
      const t = total(rows.filter((r) => r.period === p));
      return { period: p, redemptions: t.redemptions, commission: t.commission, newResidents: joinedIn(p) };
    }),
  };
}
