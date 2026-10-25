import { connection } from "next/server";
import { globalSearch } from "@/lib/admin/search";
import { requireAdmin } from "../requireAdmin";

/** GET /api/admin/search?q= — buildings, businesses and residents matching the text. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(await globalSearch(auth.db, q.slice(0, 50)));
}
