import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatAgorot } from "@/lib/qr/money";
import { notifyUsers } from "./notify";

/** Account ids of the active residents of an apartment (both phones). */
async function apartmentResidents(db: SupabaseClient, apartmentId: string): Promise<string[]> {
  const { data } = await db.from("residents").select("id").eq("apartment_id", apartmentId).eq("status", "active");
  return (data ?? []).map((r) => r.id as string);
}

/** "Redemption completed": both phones of the apartment, with what they saved. */
export async function notifyRedeemed(db: SupabaseClient, redemptionId: string): Promise<void> {
  const { data: r } = await db.from("redemptions").select("apartment_id, discount_agorot, businesses(name)").eq("id", redemptionId)
    .maybeSingle<{ apartment_id: string; discount_agorot: number; businesses: { name: string } }>();
  if (!r) return;
  await notifyUsers(db, await apartmentResidents(db, r.apartment_id), "redemptions", {
    title: "ההטבה מומשה", body: `חסכתם ${formatAgorot(r.discount_agorot)} ב${r.businesses.name}`, url: "/app/wallet",
  });
}

/** "Dispute status changed": the resident who reported it (corrected or dismissed). */
export async function notifyDisputeResolved(db: SupabaseClient, disputeId: string): Promise<void> {
  const { data: d } = await db.from("redemption_disputes").select("reported_by_user_id, status, businesses(name)").eq("id", disputeId)
    .maybeSingle<{ reported_by_user_id: string | null; status: string; businesses: { name: string } }>();
  if (!d?.reported_by_user_id) return;
  const corrected = d.status === "CORRECTED";
  await notifyUsers(db, [d.reported_by_user_id], "disputes", {
    title: corrected ? "הסכום תוקן" : "הדיווח נבדק",
    body: corrected ? `תיקנו את הסכום של המימוש ב${d.businesses.name}, וההנחה עודכנה.` : `בדקנו את הדיווח על ${d.businesses.name}. הפרטים בארנק.`,
    url: "/app/wallet",
  });
}

/** "New benefit nearby": residents of the buildings in the business's city (demo businesses only reach demo buildings). */
export async function notifyNewBenefit(db: SupabaseClient, businessId: string): Promise<void> {
  const { data: b } = await db.from("businesses").select("name, city, status, is_demo").eq("id", businessId)
    .maybeSingle<{ name: string; city: string | null; status: string; is_demo: boolean }>();
  if (!b?.city || b.status !== "active") return;
  const { data } = await db.from("residents").select("id, apartments!inner(buildings!inner(city, active, is_demo))")
    .eq("status", "active").eq("apartments.buildings.city", b.city).eq("apartments.buildings.active", true).eq("apartments.buildings.is_demo", b.is_demo);
  await notifyUsers(db, (data ?? []).map((r) => r.id as string), "new_benefits", {
    title: "הטבה חדשה ליד הבית", body: `${b.name} מחכה לכם בלובי`, url: `/app/b/${businessId}`,
  });
}

/** "Daily summary" (opt-in): each owner whose business had redemptions today. Run once a day by the cron route. */
export async function sendBizSummaries(db: SupabaseClient): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await db.from("redemptions").select("business_id, bill_agorot").eq("status", "redeemed").gte("redeemed_at", since);
  const byBusiness = new Map<string, { count: number; bill: number }>();
  for (const r of rows ?? []) {
    const t = byBusiness.get(r.business_id) ?? { count: 0, bill: 0 };
    byBusiness.set(r.business_id, { count: t.count + 1, bill: t.bill + r.bill_agorot });
  }
  const { data: owners } = await db.from("user_roles").select("user_id, business_id").eq("role", "business_owner").in("business_id", [...byBusiness.keys()]);
  for (const o of owners ?? []) {
    const t = byBusiness.get(o.business_id)!;
    await notifyUsers(db, [o.user_id], "biz_summary", {
      title: "סיכום היום בלובי", body: `${t.count} מימושים, מחזור ${formatAgorot(t.bill)}`, url: "/biz/redemptions",
    });
  }
  return owners?.length ?? 0;
}
