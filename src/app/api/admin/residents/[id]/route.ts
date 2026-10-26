import { connection } from "next/server";
import { getResidentDetail } from "@/lib/admin/residentDetail";
import { badRequest, isUuid, notFound, requireAdmin } from "../../requireAdmin";

/** GET /api/admin/residents/[id] — one resident: contact, apartment, totals and the coupons they used. */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/residents/[id]">) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isUuid(id)) return badRequest();
  const resident = await getResidentDetail(auth.db, id);
  return resident ? Response.json(resident) : notFound("הדייר");
}
