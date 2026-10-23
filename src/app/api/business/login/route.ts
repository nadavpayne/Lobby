import { WINDOW_MINUTES } from "@/lib/businesses/attempts";
import { loginBusiness, type LoginOutcome } from "@/lib/businesses/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ERRORS: Record<Extract<LoginOutcome, { ok: false }>["reason"], [number, string]> = {
  not_found: [404, "הקישור לא תקין. בדקו שהעתקתם אותו במלואו."],
  rate_limited: [429, `יותר מדי ניסיונות. נסו שוב בעוד ${WINDOW_MINUTES} דקות.`],
  wrong_pin: [400, "קוד PIN שגוי"],
};

/** POST /api/business/login — { accessSlug, pin } → { token, business }. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const outcome = await loginBusiness(createAdminClient(), body?.accessSlug, body?.pin);
  if (outcome.ok) return Response.json({ token: outcome.token, business: outcome.business });
  const [status, error] = ERRORS[outcome.reason];
  return Response.json({ error }, { status });
}
