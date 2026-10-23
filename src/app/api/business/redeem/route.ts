import { isRateLimited, recordFailure } from "@/lib/businesses/attempts";
import { isValidCode, normalizeCode } from "@/lib/codes";
import { parseAmount } from "@/lib/redemptions/money";
import { redeemCode } from "@/lib/redemptions/redeem";
import type { RedeemResult } from "@/lib/redemptions/types";
import { requireActiveBusiness, tooManyCodes } from "../requireBusiness";

/** POST /api/business/redeem — { code, amount } (full bill before discount) → RedeemResult. */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  const { db, business } = auth;

  const body = await request.json().catch(() => null);
  const amount = parseAmount(body?.amount);
  if (amount === null) return Response.json({ error: "סכום לא תקין" }, { status: 400 });

  const code = normalizeCode(body?.code);
  if (!isValidCode(code)) return Response.json({ status: "invalid" } satisfies RedeemResult);
  if (await isRateLimited(db, business.id, "code")) return tooManyCodes();

  const result = await redeemCode(db, business.id, code, amount);
  if (result.status === "invalid") await recordFailure(db, business.id, "code");
  return Response.json(result);
}
