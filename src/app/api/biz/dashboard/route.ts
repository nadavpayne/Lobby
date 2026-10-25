import { connection } from "next/server";
import { getDashboard } from "@/lib/biz/dashboard";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** GET /api/biz/dashboard — redemptions, revenue, commission, customers, daily series, top buildings. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getDashboard(auth.db, auth.business.id));
}
