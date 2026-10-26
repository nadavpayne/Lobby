import { getUserFromRequest } from "@/lib/auth/getUser";
import { submitSupportRequest } from "@/lib/support/requests";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/support — public contact form (signed-in senders are linked to their account). → { ok } */
export async function POST(request: Request) {
  const db = createAdminClient();
  const user = request.headers.has("authorization") ? await getUserFromRequest(db, request) : null;
  const body = await request.json().catch(() => null);
  const outcome = await submitSupportRequest(db, request, body, user?.id ?? null);
  if (outcome.ok) return Response.json({ ok: true });
  return Response.json({ error: outcome.error, ...(outcome.errors && { errors: outcome.errors }) }, { status: outcome.status });
}
