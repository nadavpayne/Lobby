import { connection } from "next/server";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { getPrefs, removeToken, saveToken, setPrefs } from "@/lib/push/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/push — my notification switches. */
export async function GET(request: Request) {
  await connection();
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  return Response.json(await getPrefs(db, user.id));
}

/**
 * POST /api/push — { action: "register", token, platform } | { action: "unregister", token } | { action: "prefs", prefs }.
 * Any signed-in account (residents, committee members, business owners).
 */
export async function POST(request: Request) {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.action === "register") {
    return (await saveToken(db, user.id, body.token, body.platform)) ? Response.json({ ok: true }) : Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
  if (body?.action === "unregister") {
    await removeToken(db, user.id, body.token);
    return Response.json({ ok: true });
  }
  if (body?.action === "prefs") return Response.json(await setPrefs(db, user.id, body.prefs));
  return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
}
