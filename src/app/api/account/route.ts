import { connection } from "next/server";
import { deleteAccount, deletionInfo } from "@/lib/account/deleteAccount";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/account — what deleting my account means (by role), and who could take over the committee. */
export async function GET(request: Request) {
  await connection();
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  return Response.json(await deletionInfo(db, user));
}

/** POST /api/account — { action: "delete", code, handoverTo? } → deletes the account now (after re-authentication with the code). */
export async function POST(request: Request) {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.action !== "delete") return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const outcome = await deleteAccount(db, user, token, body.code, body.handoverTo);
  return outcome.ok ? Response.json({ ok: true }) : Response.json({ error: outcome.error }, { status: outcome.status });
}
