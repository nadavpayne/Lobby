import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { createAdminClient } from "@/lib/supabase/admin";

/** Checks the request's Supabase access token belongs to ADMIN_EMAIL; returns a DB client or the error Response. */
export async function requireAdmin(request: Request): Promise<SupabaseClient | Response> {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    return Response.json({ error: "לחשבון הזה אין הרשאת ניהול" }, { status: 403 });
  }
  return db;
}
