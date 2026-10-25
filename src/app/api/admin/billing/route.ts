import { connection } from "next/server";
import { listBillingLines, setPaid } from "@/lib/admin/billing";
import { badRequest, isUuid, requireAdmin } from "../requireAdmin";

/** GET /api/admin/billing — commission per business per month with paid/open status. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listBillingLines(auth.db));
}

/** POST /api/admin/billing — { businessId, period, paid } marks a finished month paid or unpaid → the updated lines. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.businessId) || !/^\d{4}-\d{2}$/.test(body?.period ?? "") || typeof body?.paid !== "boolean") return badRequest();
  if (!(await setPaid(auth.db, body.businessId, body.period, body.paid))) return Response.json({ error: "אפשר לסגור רק חודש שהסתיים" }, { status: 409 });
  return Response.json(await listBillingLines(auth.db));
}
