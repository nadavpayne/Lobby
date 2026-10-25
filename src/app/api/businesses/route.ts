import { checkLogo, storeLogo } from "@/lib/biz/logo";
import { createBusiness } from "@/lib/businesses/createBusiness";
import { validateJoin } from "@/lib/businesses/validateJoin";
import { siteUrl } from "@/lib/siteUrl";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/businesses — business onboarding. Multipart: "data" (the form as JSON) + "logo" (required image).
 * → { loginUrl } (the business area, email sign-in); 400 with per-field errors (logo included). Nothing is saved
 * unless the form and the logo are both valid, so every business reaches the admin queue with its picture.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  let raw: unknown = null;
  try {
    raw = JSON.parse(String(form?.get("data") ?? "null"));
  } catch {
    /* falls through to validation errors */
  }
  const [result, logo] = await Promise.all([Promise.resolve(validateJoin(raw)), checkLogo(form?.get("logo"))]);
  if (!result.ok || !logo.ok) {
    return Response.json({ errors: { ...(result.ok ? {} : result.errors), ...(!logo.ok && { logo: logo.error }) } }, { status: 400 });
  }

  const db = createAdminClient();
  let businessId: string | null = null;
  try {
    businessId = (await createBusiness(result.data)).id;
    await storeLogo(db, businessId, logo);
    return Response.json({ loginUrl: `${siteUrl(request)}/biz` }, { status: 201 });
  } catch (error) {
    console.error("business sign-up failed", error);
    // No half-registered business without its logo: undo (its offer cascades) so a retry starts clean.
    if (businessId) await db.from("businesses").delete().eq("id", businessId);
    return Response.json({ error: "משהו השתבש בשמירת הפרטים. נסו שוב בעוד רגע." }, { status: 500 });
  }
}
