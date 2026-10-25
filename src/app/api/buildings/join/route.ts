import { accountTakenMessage, existingAccount } from "@/lib/auth/accountGuard";
import { getUserFromRequest } from "@/lib/auth/getUser";
import { joinBuilding } from "@/lib/buildings/joinBuilding";
import { getMembership } from "@/lib/buildings/membership";
import { validateResidentJoin } from "@/lib/buildings/validateResidentJoin";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_APARTMENTS = 500; // the exact count is checked against the building in joinBuilding

/** POST /api/buildings/join — { inviteSlug, name, apartmentNumber } → { status: "active" }. */
export async function POST(request: Request) {
  const db = createAdminClient();
  const user = await getUserFromRequest(db, request);
  if (!user) return Response.json({ error: "צריך להתחבר" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const check = validateResidentJoin(body, MAX_APARTMENTS);
  if (!check.ok) return Response.json({ errors: check.errors }, { status: 400 });
  if (await getMembership(db, user.id)) return Response.json({ error: "החשבון הזה כבר משויך לבניין" }, { status: 409 });

  const taken = await existingAccount(db, { email: user.email ?? "", userId: user.id });
  if (taken) return Response.json({ error: accountTakenMessage(taken) }, { status: 409 });

  const outcome = await joinBuilding(db, user.id, String(body?.inviteSlug ?? ""), check.data);
  if (outcome.ok) return Response.json({ status: outcome.status });
  switch (outcome.reason) {
    case "not_found":
      return Response.json({ error: "קישור ההצטרפות לא תקין" }, { status: 404 });
    case "inactive":
      return Response.json({ error: "הבניין הזה לא פעיל כרגע בלובי" }, { status: 403 });
    case "no_apartment":
      return Response.json({ errors: { apartmentNumber: "אין דירה כזו בבניין" } }, { status: 400 });
    case "full":
      // Back to the form, on the apartment field: most often it's a typo in the apartment number.
      return Response.json({ errors: { apartmentNumber: `בדירה ${check.data.apartmentNumber} כבר רשומים 2 טלפונים, וזה המקסימום לדירה. בדקו שמספר הדירה נכון.` } }, { status: 409 });
  }
}
