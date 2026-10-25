import { connection } from "next/server";
import { addCashier, listCashiers, revokeCashier } from "@/lib/biz/cashiers";
import { requireBusinessOwner } from "../requireBusinessOwner";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const REFUSALS = {
  invalid: [400, "כתובת אימייל לא תקינה"],
  elsewhere: [409, "החשבון הזה כבר קופאי בעסק אחר"],
  owner: [409, "זה החשבון שלכם: לבעלי העסק כבר יש גישה לקופה"],
} as const;

/** GET /api/biz/cashiers — owner only: my scan-only logins. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listCashiers(auth.db, auth.business.id));
}

/** POST /api/biz/cashiers — owner only: { action: "add", email } | { action: "revoke", userId } → the updated list. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (body?.action === "add") {
    const outcome = await addCashier(auth.db, auth.business.id, body.email);
    if (outcome !== "ok") {
      const [status, error] = REFUSALS[outcome];
      return Response.json({ error }, { status });
    }
  } else if (body?.action === "revoke" && typeof body.userId === "string" && UUID.test(body.userId)) {
    await revokeCashier(auth.db, auth.business.id, body.userId);
  } else {
    return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
  return Response.json(await listCashiers(auth.db, auth.business.id));
}
