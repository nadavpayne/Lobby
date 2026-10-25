import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isRateLimited, recordFailure, WINDOW_MINUTES } from "@/lib/businesses/attempts";
import { isValidCode, normalizeCode } from "@/lib/codes";
import { parseAmount } from "./money";
import { redeemCode } from "./redeem";
import type { RedeemResult, VerifyResult } from "./types";
import { lookupCode } from "./verify";

// The register logic behind both the staff terminal (/api/business/*) and the owner app (/api/biz/*).

/** 429 response after too many wrong codes. */
export const tooManyCodes = () =>
  Response.json({ error: `יותר מדי קודים שגויים. נסו שוב בעוד ${WINDOW_MINUTES} דקות.` }, { status: 429 });

/** { code } → VerifyResult. Wrong codes count toward the per-business limit. */
export async function handleVerify(db: SupabaseClient, businessId: string, request: Request): Promise<Response> {
  const code = normalizeCode((await request.json().catch(() => null))?.code);
  if (!isValidCode(code)) return Response.json({ status: "invalid" } satisfies VerifyResult);
  if (await isRateLimited(db, businessId, "code")) return tooManyCodes();

  const { result } = await lookupCode(db, businessId, code);
  if (result.status === "invalid") await recordFailure(db, businessId, "code");
  return Response.json(result);
}

/** { code, amount } (full bill before discount) → RedeemResult. */
export async function handleRedeem(db: SupabaseClient, businessId: string, request: Request): Promise<Response> {
  const body = await request.json().catch(() => null);
  const amount = parseAmount(body?.amount);
  if (amount === null) return Response.json({ error: "סכום לא תקין" }, { status: 400 });

  const code = normalizeCode(body?.code);
  if (!isValidCode(code)) return Response.json({ status: "invalid" } satisfies RedeemResult);
  if (await isRateLimited(db, businessId, "code")) return tooManyCodes();

  const result = await redeemCode(db, businessId, code, amount);
  if (result.status === "invalid") await recordFailure(db, businessId, "code");
  return Response.json(result);
}
