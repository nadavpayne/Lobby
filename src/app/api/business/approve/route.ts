import { handleApprove } from "@/lib/qr/handlers";
import { requireActiveBusiness } from "../requireBusiness";

/** POST /api/business/approve — staff PIN terminal: { scanId, amount } → ApproveResult (idempotent per scan). */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  return handleApprove(auth.db, auth.business.id, null, request);
}
