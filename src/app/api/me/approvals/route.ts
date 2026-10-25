import { connection } from "next/server";
import { decidePending, listPending } from "@/lib/buildings/approvals";
import { requireMember } from "../requireMember";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** GET /api/me/approvals — phones waiting for my approval (committee: building; resident: my apartment). */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listPending(auth.db, auth.m));
}

/** POST /api/me/approvals — { residentId, decision: "approve" | "reject" }. */
export async function POST(request: Request) {
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  const { residentId, decision } = body ?? {};
  if (typeof residentId !== "string" || !UUID.test(residentId) || (decision !== "approve" && decision !== "reject")) {
    return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
  const done = await decidePending(auth.db, auth.m, auth.userId, residentId, decision);
  return done ? Response.json({ ok: true }) : Response.json({ error: "הבקשה כבר טופלה או לא נמצאה" }, { status: 404 });
}
