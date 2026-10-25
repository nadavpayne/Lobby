import { connection } from "next/server";
import { codeHistory } from "@/lib/offers/history";
import { requireMember } from "../requireMember";

/** GET /api/me/codes — my apartment's redemptions ("my benefits") and savings. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  return Response.json(await codeHistory(auth.db, auth.m.apartmentId));
}
