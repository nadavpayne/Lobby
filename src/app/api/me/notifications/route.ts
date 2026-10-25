import { connection } from "next/server";
import { listMemberNotifications } from "@/lib/buildings/notifications";
import { requireMember } from "../requireMember";

/** GET /api/me/notifications — Lobby announcements for my building, city or everyone (newest first). */
export async function GET(request: Request) {
  await connection();
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listMemberNotifications(auth.db, auth.m));
}
