import type { SupabaseClient } from "@supabase/supabase-js";
import { getBusinessFromRequest, type Business } from "@/lib/businesses/auth";
import { STATUS_NOTICE } from "@/lib/businesses/statusNotice";
import { createAdminClient } from "@/lib/supabase/admin";

/** The signed-in, active business for a terminal API call, or the error Response to return instead. */
export async function requireActiveBusiness(request: Request): Promise<{ db: SupabaseClient; business: Business } | Response> {
  const db = createAdminClient();
  const business = await getBusinessFromRequest(db, request);
  if (!business) return Response.json({ error: "צריך להתחבר מחדש עם קוד ה-PIN" }, { status: 401 });
  if (business.status !== "active") return Response.json({ error: STATUS_NOTICE[business.status] }, { status: 403 });
  return { db, business };
}
