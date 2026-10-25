import { connection } from "next/server";
import { getOverview } from "@/lib/admin/overview";
import { requireAdmin } from "../requireAdmin";

/** GET /api/admin/overview — totals and 6-month growth. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getOverview(auth.db));
}
