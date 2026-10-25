import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getRoles } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

/** Checks the request's Supabase access token belongs to an admin account; returns a DB client + user id, or the error Response. */
export async function requireAdmin(request: Request): Promise<{ db: SupabaseClient; userId: string } | Response> {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const { roles } = await getRoles(db, user.id);
  if (!roles.includes("admin")) {
    return Response.json({ error: "לחשבון הזה אין הרשאת ניהול" }, { status: 403 });
  }
  return { db, userId: user.id };
}

/** UUID check for ids in admin request bodies and paths. */
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);

/** 400 with field errors (or just a message). */
export const badRequest = (errors?: object) =>
  Response.json({ error: errors ? "יש שדות שצריך לתקן" : "בקשה לא תקינה", ...(errors && { errors }) }, { status: 400 });

/** 404 with a Hebrew message. */
export const notFound = (what: string) => Response.json({ error: `${what} לא נמצא` }, { status: 404 });
