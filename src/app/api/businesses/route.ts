import { createBusiness } from "@/lib/businesses/createBusiness";
import { validateJoin } from "@/lib/businesses/validateJoin";
import { siteUrl } from "@/lib/siteUrl";

/** POST /api/businesses — business onboarding. JSON in, { loginUrl } (the business area, email sign-in) out (400 with per-field errors). */
export async function POST(request: Request) {
  const result = validateJoin(await request.json().catch(() => null));
  if (!result.ok) return Response.json({ errors: result.errors }, { status: 400 });

  try {
    await createBusiness(result.data);
    return Response.json({ loginUrl: `${siteUrl(request)}/biz` }, { status: 201 });
  } catch (error) {
    console.error("createBusiness failed", error);
    return Response.json({ error: "משהו השתבש בשמירת הפרטים. נסו שוב בעוד רגע." }, { status: 500 });
  }
}
