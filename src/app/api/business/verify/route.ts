import { handleVerify } from "@/lib/redemptions/handlers";
import { requireActiveBusiness } from "../requireBusiness";

/** POST /api/business/verify — staff terminal: { code } → VerifyResult. */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  return handleVerify(auth.db, auth.business.id, request);
}
