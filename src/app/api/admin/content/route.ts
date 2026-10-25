import { connection } from "next/server";
import { deleteBanner, getContent, saveBanner, sendNotification, updateCategory } from "@/lib/admin/content";
import { validateBanner, validateNotification } from "@/lib/admin/validate";
import { badRequest, isUuid, notFound, requireAdmin } from "../requireAdmin";

/** GET /api/admin/content — banners, categories and recent announcements. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  return Response.json(await getContent(auth.db));
}

/**
 * POST /api/admin/content — { action: "banner", id?, ...banner } | { action: "deleteBanner", id } |
 * { action: "category", slug, name, sort, active } | { action: "notify", ...announcement } → the updated content.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (body?.id !== undefined && !isUuid(body.id)) return badRequest();

  if (body?.action === "banner") {
    const v = validateBanner(body);
    if (!v.ok) return badRequest(v.errors);
    if (!(await saveBanner(auth.db, v.data, body.id))) return notFound("הבאנר");
  } else if (body?.action === "deleteBanner" && body.id) {
    await deleteBanner(auth.db, body.id);
  } else if (body?.action === "category" && typeof body.slug === "string") {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const sort = Number(body.sort);
    if (!name || name.length > 20 || !Number.isInteger(sort) || typeof body.active !== "boolean") return badRequest({ name: "שם עד 20 תווים" });
    if (!(await updateCategory(auth.db, body.slug, name, sort, body.active))) return notFound("הקטגוריה");
  } else if (body?.action === "notify") {
    const v = validateNotification(body);
    if (!v.ok) return badRequest(v.errors);
    await sendNotification(auth.db, v.data, auth.userId);
  } else {
    return badRequest();
  }
  return Response.json(await getContent(auth.db));
}
