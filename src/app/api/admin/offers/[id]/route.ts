import { getBusiness } from "@/lib/admin/businesses";
import { applyOfferAction, parseOfferAction } from "@/lib/admin/offers";
import { siteUrl } from "@/lib/siteUrl";
import { badRequest, isUuid, notFound, requireAdmin } from "../../requireAdmin";

/** POST /api/admin/offers/[id] — { action: approve | unapprove | discount | featured | active } → the offer's business. */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/offers/[id]">) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  const action = parseOfferAction(await request.json().catch(() => null));
  if (!isUuid(id) || !action) return badRequest();
  const businessId = await applyOfferAction(auth.db, id, action);
  return businessId ? Response.json(await getBusiness(auth.db, businessId, siteUrl(request))) : notFound("ההטבה");
}
