import { resetDemoCode } from "@/lib/demo/demo";
import { requireActiveBusiness } from "../requireBusiness";

/** POST /api/business/demo-reset — demo business only: makes the demo code unused and valid again. */
export async function POST(request: Request) {
  const auth = await requireActiveBusiness(request);
  if (auth instanceof Response) return auth;
  if (!auth.business.is_demo) return Response.json({ error: "זמין רק לעסק ההדגמה" }, { status: 403 });

  await resetDemoCode(auth.db, auth.business.id);
  return Response.json({ ok: true });
}
