import { getAddressProvider, logGoogleCall, underDailyCap } from "@/lib/address/resolve";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "../../admin/requireAdmin";

const BUSY = { error: "חיפוש הכתובות לא זמין כרגע. נסו שוב מאוחר יותר." };

/** POST /api/address/autocomplete — { q, session } → { suggestions } (Israel, Hebrew). The only way the app reaches the provider. */
export async function POST(request: Request) {
  const provider = getAddressProvider();
  if (!provider) return Response.json(BUSY, { status: 503 });
  const body = await request.json().catch(() => null);
  const q = typeof body?.q === "string" ? body.q.trim() : "";
  if (q.length < 3 || q.length > 100 || !isUuid(body?.session)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });

  const db = createAdminClient();
  // shortcut: one global daily cap, no per-visitor limit; add per-IP limits if someone burns the cap on purpose.
  if (!(await underDailyCap(db, "autocomplete"))) return Response.json(BUSY, { status: 429 });
  try {
    const suggestions = await provider.autocomplete(q, body.session);
    await logGoogleCall(db, "autocomplete");
    return Response.json({ suggestions });
  } catch (e) {
    console.error("autocomplete failed", e);
    return Response.json(BUSY, { status: 502 });
  }
}
