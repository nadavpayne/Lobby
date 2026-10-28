import { reviewLoginTokenHash } from "@/lib/auth/reviewLogin";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/review-login — { email, code } → { tokenHash } for the store reviewers' demo account; 401 otherwise. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const tokenHash = await reviewLoginTokenHash(createAdminClient(), body?.email, body?.code);
  return tokenHash ? Response.json({ tokenHash }) : Response.json({ error: "הקוד שגוי או שפג תוקפו" }, { status: 401 });
}
