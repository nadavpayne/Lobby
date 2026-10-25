import { connection } from "next/server";
import { getDispute } from "@/lib/disputes/admin";
import { badRequest, isUuid, notFound, requireAdmin } from "../../requireAdmin";

/** GET /api/admin/disputes/[id] — one dispute with note, signed receipt link, the redemption and the business's history. */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/disputes/[id]">) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!isUuid(id)) return badRequest();
  const dispute = await getDispute(auth.db, id);
  return dispute ? Response.json(dispute) : notFound("הדיווח");
}
