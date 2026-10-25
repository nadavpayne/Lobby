import { connection } from "next/server";
import { listBizOffers, saveBizOffer } from "@/lib/biz/offers";
import { validateOffer } from "@/lib/biz/validateOffer";
import { requireBusinessOwner } from "../requireBusinessOwner";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** GET /api/biz/offers — my offers, newest first. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listBizOffers(auth.db, auth.business.id));
}

/** POST /api/biz/offers — create ({...offer}) or edit ({ id, ...offer }); content edits wait for Lobby's approval. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (id !== undefined && (typeof id !== "string" || !UUID.test(id))) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });

  const v = validateOffer(body);
  if (!v.ok) return Response.json({ error: "יש שדות שצריך לתקן", errors: v.errors }, { status: 400 });
  const saved = await saveBizOffer(auth.db, auth.business.id, v.data, id);
  return saved ? Response.json(saved) : Response.json({ error: "ההטבה לא נמצאה" }, { status: 404 });
}
