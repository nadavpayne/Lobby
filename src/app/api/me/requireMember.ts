import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getMembership, type Membership } from "@/lib/buildings/membership";
import { createAdminClient } from "@/lib/supabase/admin";

/** The signed-in, approved member of an active building, or the error Response to return instead. */
export async function requireMember(request: Request): Promise<{ db: SupabaseClient; userId: string; m: Membership } | Response> {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  const m = await getMembership(db, user.id);
  if (!m) return Response.json({ error: "החשבון לא משויך לבניין" }, { status: 403 });
  if (m.status === "blocked") return Response.json({ error: "החשבון חסום. לפרטים פנו לצוות לובי." }, { status: 403 });
  if (m.status !== "active") return Response.json({ error: "החשבון ממתין לאישור" }, { status: 403 });
  if (!m.building.active) return Response.json({ error: "הבניין לא פעיל כרגע בלובי" }, { status: 403 });
  return { db, userId: user.id, m };
}
