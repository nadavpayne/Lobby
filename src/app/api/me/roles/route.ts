import { connection } from "next/server";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { homeFor } from "@/lib/auth/homeFor";
import { getRoles, linkOwnedBusinesses } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/me/roles — the signed-in account's roles and the app it should open. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  await linkOwnedBusinesses(db, user);
  const { roles } = await getRoles(db, user.id);
  return Response.json({ roles, home: homeFor(roles) });
}
