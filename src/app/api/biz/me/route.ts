import { connection } from "next/server";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** GET /api/biz/me — the owner's business: name and status (for the CRM header and notices). */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json({ name: auth.business.name, status: auth.business.status });
}
