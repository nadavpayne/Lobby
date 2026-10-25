import { handleRedeem } from "@/lib/redemptions/handlers";
import { requireActiveBusiness } from "../requireBusiness";

/** POST /api/business/redeem — staff terminal: { code, amount } (full bill before discount) → RedeemResult. */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  return handleRedeem(auth.db, auth.business.id, request);
}
