import { connection } from "next/server";
import { listSupportRequests, setSupportStatus } from "@/lib/support/requests";
import { badRequest, isUuid, notFound, requireAdmin } from "../requireAdmin";

const STATUSES = ["open", "answered", "closed"] as const;

/** GET /api/admin/support?status&topic&role — support requests, newest first. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const p = new URL(request.url).searchParams;
  return Response.json(await listSupportRequests(auth.db, { status: p.get("status"), topic: p.get("topic"), role: p.get("role") }));
}

/** POST /api/admin/support — { id, status } → { ok }. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  const status = STATUSES.find((s) => s === body?.status);
  if (!isUuid(body?.id) || !status) return badRequest();
  return (await setSupportStatus(auth.db, body.id, status)) ? Response.json({ ok: true }) : notFound("הפנייה");
}
