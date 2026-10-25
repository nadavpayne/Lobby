import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getRoles } from "@/lib/auth/roles";
import { STATUS_NOTICE } from "@/lib/businesses/statusNotice";
import type { BusinessStatus } from "@/lib/businesses/types";
import { createAdminClient } from "@/lib/supabase/admin";

export interface OwnedBusiness {
  id: string;
  name: string;
  status: BusinessStatus;
  access_slug: string;
}

/**
 * The signed-in business owner and the business they act for, or the error Response to return instead.
 * Every /api/biz query must filter by the returned business.id.
 */
export async function requireBusinessOwner(request: Request): Promise<{ db: SupabaseClient; userId: string; business: OwnedBusiness } | Response> {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const { businessIds } = await getRoles(db, user.id);
  // shortcut: an owner of several businesses always acts for the first one; add a business switcher when one asks.
  const businessId = businessIds[0];
  if (!businessId) return Response.json({ error: "לחשבון הזה אין עסק בלובי" }, { status: 403 });
  const { data, error } = await db.from("businesses").select("id, name, status, access_slug").eq("id", businessId).single<OwnedBusiness>();
  if (error) throw error;
  return { db, userId: user.id, business: data };
}

/**
 * Someone allowed to work the register of an active business: its owner or one of its cashiers.
 * Cashiers get scan + approve only; every other /api/biz route uses requireBusinessOwner.
 */
export async function requireRegister(request: Request): Promise<{ db: SupabaseClient; userId: string; businessId: string } | Response> {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  const { businessIds, cashierBusinessIds } = await getRoles(db, user.id);
  const businessId = businessIds[0] ?? cashierBusinessIds[0];
  if (!businessId) return Response.json({ error: "לחשבון הזה אין גישה לקופה" }, { status: 403 });
  const { data, error } = await db.from("businesses").select("status").eq("id", businessId).single<{ status: BusinessStatus }>();
  if (error) throw error;
  if (data.status !== "active") return Response.json({ error: STATUS_NOTICE[data.status] }, { status: 403 });
  return { db, userId: user.id, businessId };
}
