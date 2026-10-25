import { handleApprove } from "@/lib/qr/handlers";
import { requireRegister } from "../requireBusinessOwner";

/** POST /api/biz/approve — owner or cashier: { scanId, amount } → ApproveResult (idempotent per scan). */
export async function POST(request: Request) {
  const auth = await requireRegister(request);
  if (auth instanceof Response) return auth;
  return handleApprove(auth.db, auth.businessId, auth.userId, request);
}
