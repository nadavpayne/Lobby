import { connection } from "next/server";
import { listBusinesses } from "@/lib/admin/businesses";
import { siteUrl } from "@/lib/siteUrl";
import { requireAdmin } from "../requireAdmin";

/** GET /api/admin/businesses — every business with status, offer and verification link. Admin only. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const db = await requireAdmin(request);
  if (db instanceof Response) return db;
  return Response.json(await listBusinesses(db, siteUrl(request)));
}
