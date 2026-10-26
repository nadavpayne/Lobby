import { connection } from "next/server";
import { getReach } from "@/lib/biz/reach";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** GET /api/biz/reach — the business's storefront and how many Lobby households are within 500 m / 1 km (counts only). */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getReach(auth.db, auth.business.id));
}
