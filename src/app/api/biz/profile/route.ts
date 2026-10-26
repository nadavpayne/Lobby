import { connection } from "next/server";
import { addressFromForm } from "@/lib/address/resolve";
import { branchGeo, getProfile, saveProfile } from "@/lib/biz/profile";
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
  const business = await addressFromForm(auth.db, { placeId: v.data.placeId, pin: v.data.pin }, { required: false, withPin: true });
  if (!business.ok) return Response.json({ error: "יש שדות שצריך לתקן", errors: { address: business.error } }, { status: 400 });
  // A branch keeps its stored location; only a newly picked branch address is resolved.
  const stored = await branchGeo(auth.db, auth.business.id);
  const branches = await Promise.all(
    v.data.branches.map((b) => (b.placeId && stored.has(b.placeId) ? { ok: true as const, columns: stored.get(b.placeId)! } : addressFromForm(auth.db, b, { required: false }))),
  );
  const bad = branches.find((b) => !b.ok);
  if (bad && !bad.ok) return Response.json({ error: "יש שדות שצריך לתקן", errors: { branches: bad.error } }, { status: 400 });

  const current = await getProfile(auth.db, auth.business.id, siteUrl(request));
  await saveProfile(auth.db, auth.business.id, v.data, current.city, {
    business: business.columns,
    branches: branches.map((b) => (b.ok ? b.columns : null)),
  });
  return Response.json(await getProfile(auth.db, auth.business.id, siteUrl(request)));
}
