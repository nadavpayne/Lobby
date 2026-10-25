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

/** Like requireBusinessOwner, but the business must be active (for redeeming codes). */
export async function requireActiveOwner(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response || auth.business.status === "active") return auth;
  return Response.json({ error: STATUS_NOTICE[auth.business.status] }, { status: 403 });
}
