import { saveLogo } from "@/lib/biz/logo";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** POST /api/biz/logo — owner only: multipart field "file" (the business's one photo) → { logoUrl }. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "לא נבחרה תמונה" }, { status: 400 });
  const outcome = await saveLogo(auth.db, auth.business.id, file);
  return outcome.ok ? Response.json({ logoUrl: outcome.logoUrl }) : Response.json({ error: outcome.error }, { status: 400 });
}
