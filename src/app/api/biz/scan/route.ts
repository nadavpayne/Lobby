import { handleScan } from "@/lib/qr/handlers";
import { requireRegister } from "../requireBusinessOwner";

/** POST /api/biz/scan — owner or cashier: { code } (QR payload or backup code) → ScanResult. */
export async function POST(request: Request) {
  const auth = await requireRegister(request);
  if (auth instanceof Response) return auth;
  return handleScan(auth.db, auth.businessId, auth.userId, request);
}
