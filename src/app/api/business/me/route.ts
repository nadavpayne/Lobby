import { connection } from "next/server";
import { getBusinessFromRequest, toBusinessInfo } from "@/lib/businesses/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/business/me — name and status of the business behind the bearer token. */
export async function GET(request: Request) {
  await connection(); // per-request auth: never prerender at build time (cacheComponents is on)
  const business = await getBusinessFromRequest(createAdminClient(), request);
  if (!business) return Response.json({ error: "צריך להתחבר מחדש עם קוד ה-PIN" }, { status: 401 });
  return Response.json(toBusinessInfo(business));
}
