import { connection } from "next/server";
import { buildingStats } from "@/lib/buildings/buildingStats";
import { requireMember } from "../../requireMember";

/** GET /api/me/building/stats — committee only: the building's members and savings this month. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  if (auth.m.role !== "committee") return Response.json({ error: "רק לוועד הבית" }, { status: 403 });
  return Response.json(await buildingStats(auth.db, auth.m));
}
