import { setBusinessStatus } from "@/lib/admin/businesses";
import type { StatusChange } from "@/lib/admin/types";
import { siteUrl } from "@/lib/siteUrl";
import { requireAdmin } from "../../../requireAdmin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ALLOWED: StatusChange[] = ["active", "paused"];

/** POST /api/admin/businesses/[id]/status — { status: "active" | "paused" } → updated business. Admin only. */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/businesses/[id]/status">) {
  const db = await requireAdmin(request);
  if (db instanceof Response) return db;

  const { id } = await ctx.params;
  const status = (await request.json().catch(() => null))?.status;
  if (!UUID.test(id) || !ALLOWED.includes(status)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });

  const business = await setBusinessStatus(db, id, status, siteUrl(request));
  return business ? Response.json(business) : Response.json({ error: "העסק לא נמצא" }, { status: 404 });
}
