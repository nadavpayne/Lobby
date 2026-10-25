import { reportDispute } from "@/lib/disputes/report";
import { requireMember } from "../requireMember";

/** POST /api/me/disputes — multipart: redemptionId, reason, claimedBill?, note?, photo? → report a wrong amount. */
export async function POST(request: Request) {
  const auth = await requireMember(request);
  if (auth instanceof Response) return auth;
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const outcome = await reportDispute(auth.db, { userId: auth.userId, apartmentId: auth.m.apartmentId }, {
    redemptionId: form.get("redemptionId"),
    reason: form.get("reason"),
    claimedBill: form.get("claimedBill"),
    note: form.get("note"),
    photo: form.get("photo"),
  });
  if (outcome.ok) return Response.json({ ok: true });
  return Response.json({ error: outcome.error, ...(outcome.errors && { errors: outcome.errors }) }, { status: outcome.status });
}
