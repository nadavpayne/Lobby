import { connection } from "next/server";
import { listOffers } from "@/lib/offers/listOffers";
import { requireMember } from "../requireMember";

/** GET /api/me/offers — offers for my building, with this month's state for my apartment. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listOffers(auth.db, auth.m));
}
