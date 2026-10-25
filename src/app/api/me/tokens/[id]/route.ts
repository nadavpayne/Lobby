import { connection } from "next/server";
import { tokenStatus } from "@/lib/qr/issue";
import { requireMember } from "../../requireMember";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** GET /api/me/tokens/[id] — where my token stands (active / expired / replaced / used + receipt). Polled by the QR screen. */
export async function GET(request: Request, ctx: RouteContext<"/api/me/tokens/[id]">) {
  await connection();
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const status = await tokenStatus(auth.db, auth.m, id);
  return status ? Response.json(status) : Response.json({ error: "הקוד לא נמצא" }, { status: 404 });
}
