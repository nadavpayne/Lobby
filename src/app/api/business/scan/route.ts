import { handleScan } from "@/lib/qr/handlers";
import { requireActiveBusiness } from "../requireBusiness";

/** POST /api/business/scan — staff PIN terminal: { code } → ScanResult. */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  return handleScan(auth.db, auth.business.id, null, request);
}
