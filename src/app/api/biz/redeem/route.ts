import { handleRedeem } from "@/lib/redemptions/handlers";
import { requireActiveOwner } from "../requireBusinessOwner";

/** POST /api/biz/redeem — business owner app: { code, amount } (full bill before discount) → RedeemResult. */
export async function POST(request: Request) {
  const auth = await requireActiveOwner(request);
  if (auth instanceof Response) return auth;
  return handleRedeem(auth.db, auth.business.id, request);
}
