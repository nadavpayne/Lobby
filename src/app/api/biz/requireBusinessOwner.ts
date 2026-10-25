import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getRoles } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The signed-in business owner and the business they act for, or the error Response to return instead.
 * Every /api/biz query must filter by the returned businessId.
 */
export async function requireBusinessOwner(request: Request): Promise<{ db: SupabaseClient; userId: string; businessId: string } | Response> {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const { businessIds } = await getRoles(db, user.id);
  // shortcut: an owner of several businesses always acts for the first one; add a business switcher when one asks.
  const businessId = businessIds[0];
  if (!businessId) return Response.json({ error: "לחשבון הזה אין עסק בלובי" }, { status: 403 });
  return { db, userId: user.id, businessId };
}
