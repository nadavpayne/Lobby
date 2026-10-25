import { connection } from "next/server";
import { listResidents, setResidentStatus } from "@/lib/admin/residents";
import { badRequest, isUuid, notFound, requireAdmin } from "../requireAdmin";

/** GET /api/admin/residents?q=&building= — residents with apartment, building and activity. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const p = new URL(request.url).searchParams;
  const building = p.get("building");
  return Response.json(await listResidents(auth.db, (p.get("q") ?? "").slice(0, 50), isUuid(building) ? building : null));
}

/** POST /api/admin/residents — { id, status: "active" | "blocked" } blocks or unblocks a resident. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.id) || (body.status !== "active" && body.status !== "blocked")) return badRequest();
  return (await setResidentStatus(auth.db, body.id, body.status)) ? Response.json({ ok: true }) : notFound("הדייר");
}
