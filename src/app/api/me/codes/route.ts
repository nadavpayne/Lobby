import { connection } from "next/server";
import { codeHistory } from "@/lib/offers/history";
import { issueCode } from "@/lib/offers/issueCode";
import { requireMember } from "../requireMember";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const REFUSALS = {
  not_found: [404, "ההטבה לא זמינה לבניין שלכם"],
  used: [409, "כבר מימשתם את ההטבה בעסק הזה החודש"],
  sold_out: [409, "ההטבה אזלה בבניין שלכם"],
} as const;

/** GET /api/me/codes — my apartment's codes and savings. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  return Response.json(await codeHistory(auth.db, auth.m.apartmentId));
}

/** POST /api/me/codes — { businessId } → a 6-digit code valid 10 minutes (or the live one, if already issued). */
export async function POST(request: Request) {
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  const businessId = (await request.json().catch(() => null))?.businessId;
  if (typeof businessId !== "string" || !UUID.test(businessId)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });

  const outcome = await issueCode(auth.db, auth.userId, auth.m, businessId);
  if (outcome.ok) return Response.json(outcome.code);
  const [status, error] = REFUSALS[outcome.reason];
  return Response.json({ error }, { status });
}
