import { connection } from "next/server";
import { listBilling } from "@/lib/biz/billing";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** GET /api/biz/billing — monthly commission statements with payment status. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listBilling(auth.db, auth.business.id));
}
