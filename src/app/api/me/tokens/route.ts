import { issueToken } from "@/lib/qr/issue";
import { requireMember } from "../requireMember";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const REFUSALS = {
  not_found: [404, "ההטבה לא זמינה לבניין שלכם"],
  used: [409, "כבר מימשתם את ההטבה בעסק הזה החודש"],
  used_once: [409, "ההטבה בעסק הזה ניתנת פעם אחת, וכבר מימשתם אותה"],
  sold_out: [409, "ההטבה אזלה בבניין שלכם"],
} as const;

/** POST /api/me/tokens — { businessId } → a fresh 5-minute QR + backup code (replaces any previous one). */
export async function POST(request: Request) {
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  const businessId = (await request.json().catch(() => null))?.businessId;
  if (typeof businessId !== "string" || !UUID.test(businessId)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const outcome = await issueToken(auth.db, auth.userId, auth.m, businessId);
  if (outcome.ok) return Response.json(outcome.token);
  const [status, error] = REFUSALS[outcome.reason];
  return Response.json({ error }, { status });
}
