import { setBizOfferActive } from "@/lib/biz/offers";
import { requireBusinessOwner } from "../../requireBusinessOwner";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** POST /api/biz/offers/active — { id, active } pauses or re-activates one of my offers. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string" || !UUID.test(body.id) || typeof body?.active !== "boolean") return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const offer = await setBizOfferActive(auth.db, auth.business.id, body.id, body.active);
  return offer ? Response.json(offer) : Response.json({ error: "ההטבה לא נמצאה" }, { status: 404 });
}
