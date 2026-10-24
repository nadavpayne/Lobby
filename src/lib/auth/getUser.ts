import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** The Supabase user behind the request's "Authorization: Bearer <access token>", or null. */
export async function getUserFromRequest(db: SupabaseClient, request: Request): Promise<User | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}
