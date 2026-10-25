import { connection } from "next/server";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getRoles } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/biz/me — the business I own or work the register for: name, status, logo, and my role there. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  const { businessIds, cashierBusinessIds } = await getRoles(db, user.id);
  const role = businessIds[0] ? "owner" : cashierBusinessIds[0] ? "cashier" : null;
  if (!role) return Response.json({ error: "לחשבון הזה אין עסק בלובי" }, { status: 403 });
  const { data, error } = await db.from("businesses").select("name, status, logo_url").eq("id", businessIds[0] ?? cashierBusinessIds[0]).single();
  if (error) throw error;
  return Response.json({ name: data.name, status: data.status, role, email: user.email ?? null, logoUrl: data.logo_url });
}
