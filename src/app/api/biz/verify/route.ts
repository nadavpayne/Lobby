import { handleVerify } from "@/lib/redemptions/handlers";
import { requireActiveOwner } from "../requireBusinessOwner";

/** POST /api/biz/verify — business owner app: { code } → VerifyResult. */
export async function POST(request: Request) {
  const auth = await requireActiveOwner(request);
  if (auth instanceof Response) return auth;
  return handleVerify(auth.db, auth.business.id, request);
}
