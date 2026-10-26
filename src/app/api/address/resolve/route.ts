import { addressProblem } from "@/lib/address/rules";
import { getAddressProvider, resolvePlace } from "@/lib/address/resolve";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "../../admin/requireAdmin";

/** POST /api/address/resolve — { placeId, session } → { address, problem } (problem: Hebrew reason it can't be used, or null). */
export async function POST(request: Request) {
  const provider = getAddressProvider();
  if (!provider) return Response.json({ error: "חיפוש הכתובות לא זמין כרגע" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const placeId = typeof body?.placeId === "string" ? body.placeId : "";
  if (!placeId || placeId.length > 300 || !isUuid(body?.session)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });

  try {
    const address = await resolvePlace(createAdminClient(), provider, placeId, body.session);
    return Response.json({ address, problem: addressProblem(address) });
  } catch (e) {
    console.error("address resolve failed", e);
    return Response.json({ error: "לא הצלחנו לבדוק את הכתובת כרגע. נסו שוב בעוד רגע." }, { status: 502 });
  }
}
