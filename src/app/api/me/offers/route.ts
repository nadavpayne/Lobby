import { connection } from "next/server";
import { getFeed } from "@/lib/offers/feed";
import { requireMember } from "../requireMember";

/** GET /api/me/offers — my building's feed: offers with this month's state for my apartment, categories, savings. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender (cacheComponents is on)
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getFeed(auth.db, auth.m, auth.userId));
}
