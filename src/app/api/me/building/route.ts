import { connection } from "next/server";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getMembership } from "@/lib/buildings/membership";
import type { MyBuilding } from "@/lib/buildings/types";
import { siteUrl } from "@/lib/siteUrl";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/me/building — the signed-in user's building, or { building: null } if they haven't joined one. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const m = await getMembership(db, user.id);
  if (!m) return Response.json({ building: null });
  const { count, error } = await db
    .from("residents")
    .select("id, apartments!inner(building_id)", { count: "exact", head: true })
    .eq("apartments.building_id", m.building.id)
    .eq("status", "active");
  if (error) throw error;
  const building: MyBuilding = {
    role: m.role,
    status: m.status,
    apartmentNumber: m.apartmentNumber,
    address: m.building.address,
    city: m.building.city,
    apartmentCount: m.building.apartmentCount,
    name: m.building.name,
    neighbors: count ?? 0,
    committeeName: m.building.committeeName,
    committeePhone: m.building.committeePhone,
    ...(m.role === "committee" && { inviteUrl: `${siteUrl(request)}/i/${m.building.inviteSlug}` }),
  };
  return Response.json({ building });
}
