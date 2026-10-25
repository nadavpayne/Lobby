import { connection } from "next/server";
import { getProfile, saveProfile } from "@/lib/biz/profile";
import { validateProfile } from "@/lib/biz/validateProfile";
import { siteUrl } from "@/lib/siteUrl";
import { requireBusinessOwner } from "../requireBusinessOwner";

/** GET /api/biz/profile — business details, hours, branches, commission rate and the staff terminal link. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getProfile(auth.db, auth.business.id, siteUrl(request)));
}

/** POST /api/biz/profile — saves description, phone, address, images, hours and branches; returns the profile. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const v = validateProfile(await request.json().catch(() => null));
  if (!v.ok) return Response.json({ error: "יש שדות שצריך לתקן", errors: v.errors }, { status: 400 });
  const current = await getProfile(auth.db, auth.business.id, siteUrl(request));
  await saveProfile(auth.db, auth.business.id, v.data, current.city);
  return Response.json({ ...current, ...v.data });
}
