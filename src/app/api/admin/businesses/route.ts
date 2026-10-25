import { connection } from "next/server";
import { createBusinessLead, getBusiness, listBusinesses, setBusinessStatus, setCommission } from "@/lib/admin/businesses";
import { validateBusinessLead, validateCommission } from "@/lib/admin/validate";
import type { BusinessStatus } from "@/lib/businesses/types";
import { siteUrl } from "@/lib/siteUrl";
import { badRequest, isUuid, notFound, requireAdmin } from "../requireAdmin";

const STATUSES: BusinessStatus[] = ["lead", "pending", "active", "paused", "declined"];

/** GET /api/admin/businesses — every business with stage, contract, offers and terminal link. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listBusinesses(auth.db, siteUrl(request)));
}

/**
 * POST /api/admin/businesses — { action: "lead", ...business } | { action: "status", id, status } |
 * { action: "commission", id, commissionPercent } → the created/updated business.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  let id: unknown = body?.id;

  if (body?.action === "lead") {
    const v = validateBusinessLead(body);
    if (!v.ok) return badRequest(v.errors);
    id = await createBusinessLead(auth.db, v.data);
  } else if (body?.action === "status" && isUuid(id) && STATUSES.includes(body.status)) {
    if (!(await setBusinessStatus(auth.db, id, body.status))) return notFound("העסק");
  } else if (body?.action === "commission" && isUuid(id)) {
    const rate = validateCommission(body.commissionPercent);
    if (rate === null) return badRequest({ commissionPercent: "עמלה בין 0 ל-100" });
    if (!(await setCommission(auth.db, id, rate))) return notFound("העסק");
  } else {
    return badRequest();
  }
  return Response.json(await getBusiness(auth.db, id as string, siteUrl(request)));
}
