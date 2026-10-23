import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/** Checks the request's Supabase access token belongs to ADMIN_EMAIL; returns a DB client or the error Response. */
export async function requireAdmin(request: Request): Promise<SupabaseClient | Response> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return Response.json({ error: "צריך להתחבר מחדש" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail || data.user.email?.toLowerCase() !== adminEmail) {
    return Response.json({ error: "לחשבון הזה אין הרשאת ניהול" }, { status: 403 });
  }
  return db;
}
