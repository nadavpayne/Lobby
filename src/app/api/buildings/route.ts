import { accountTakenMessage, existingAccount } from "@/lib/auth/accountGuard";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { createBuilding } from "@/lib/buildings/createBuilding";
import { getMembership } from "@/lib/buildings/membership";
import { validateBuilding } from "@/lib/buildings/validateBuilding";
import { siteUrl } from "@/lib/siteUrl";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/buildings — a signed-in committee member registers their building → { inviteUrl }. */
export async function POST(request: Request) {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const result = validateBuilding(await request.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });

  if (await getMembership(db, user.id)) {
    return Response.json({ error: "החשבון הזה כבר משויך לבניין" }, { status: 409 });
  }
  const taken = await existingAccount(db, { email: user.email ?? "", userId: user.id });
  if (taken) return Response.json({ error: accountTakenMessage(taken) }, { status: 409 });
  const created = await createBuilding(db, user.id, result.data);
  if ("exists" in created) {
    return Response.json({ error: "הבניין הזה כבר רשום בלובי. בקשו מהוועד את קישור ההצטרפות." }, { status: 409 });
  }
  return Response.json({ inviteUrl: `${siteUrl(request)}/i/${created.inviteSlug}` }, { status: 201 });
}
