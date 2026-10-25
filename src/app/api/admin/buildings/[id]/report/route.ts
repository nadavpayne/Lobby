import { connection } from "next/server";
import { committeeReport } from "@/lib/admin/buildings";
import { currentPeriod } from "@/lib/period";
import { badRequest, isUuid, notFound, requireAdmin } from "../../../requireAdmin";

/** GET /api/admin/buildings/[id]/report?period=YYYY-MM — the monthly committee report (defaults to this month). */
export async function GET(request: Request, ctx: RouteContext<"/api/admin/buildings/[id]/report">) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const period = new URL(request.url).searchParams.get("period") ?? currentPeriod();
  if (!isUuid(id) || !/^\d{4}-\d{2}$/.test(period)) return badRequest();
  const report = await committeeReport(auth.db, id, period);
  return report ? Response.json(report) : notFound("הבניין");
}
