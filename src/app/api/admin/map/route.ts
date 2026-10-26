import { connection } from "next/server";
import { getAdminMap } from "@/lib/admin/map";
import { requireAdmin } from "../requireAdmin";

/** GET /api/admin/map — every building and business with a location, and this month's Google usage. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getAdminMap(auth.db));
}
