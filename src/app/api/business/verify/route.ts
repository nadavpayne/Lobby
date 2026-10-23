import { isRateLimited, recordFailure } from "@/lib/businesses/attempts";
import { isValidCode, normalizeCode } from "@/lib/codes";
import type { VerifyResult } from "@/lib/redemptions/types";
import { lookupCode } from "@/lib/redemptions/verify";
import { requireActiveBusiness, tooManyCodes } from "../requireBusiness";

/** POST /api/business/verify — { code } → VerifyResult. Wrong codes count toward the per-business limit. */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  const { db, business } = auth;

  const code = normalizeCode((await request.json().catch(() => null))?.code);
  if (!isValidCode(code)) return Response.json({ status: "invalid" } satisfies VerifyResult);
  if (await isRateLimited(db, business.id, "code")) return tooManyCodes();

  const { result } = await lookupCode(db, business.id, code);
  if (result.status === "invalid") await recordFailure(db, business.id, "code");
  return Response.json(result);
}
