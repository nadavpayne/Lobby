import { connection } from "next/server";
import { addressFromForm } from "@/lib/address/resolve";
import { deleteBuilding, listBuildings, regenerateInvite, saveBuilding } from "@/lib/admin/buildings";
import { validateBuildingLead } from "@/lib/admin/validate";
import { siteUrl } from "@/lib/siteUrl";
import { badRequest, isUuid, notFound, requireAdmin } from "../requireAdmin";

/** GET /api/admin/buildings — the committee pipeline with join rates and activity. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listBuildings(auth.db, siteUrl(request)));
}

/** POST /api/admin/buildings — { action: "save", id?, ...building } | { action: "invite" | "delete", id } → the updated list. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (body?.id !== undefined && !isUuid(body.id)) return badRequest();

  if (body?.action === "save") {
    const v = validateBuildingLead(body);
    if (!v.ok) return badRequest(v.errors);
    // Editing without re-picking keeps the stored address.
    const place = await addressFromForm(auth.db, body, { required: !body.id });
    if (!place.ok) return badRequest({ address: place.error });
    if (!(await saveBuilding(auth.db, v.data, body.id, place.columns))) return notFound("הבניין");
  } else if (body?.action === "invite" && body.id) {
    if (!(await regenerateInvite(auth.db, body.id))) return notFound("הבניין");
  } else if (body?.action === "delete" && body.id) {
    const outcome = await deleteBuilding(auth.db, body.id);
    if (outcome === "not_found") return notFound("הבניין");
    if (outcome === "has_redemptions") {
      return Response.json({ error: "בבניין כבר היו מימושים, ולכן אי אפשר למחוק אותו. אפשר להעביר אותו לשלב „ליד” במקום." }, { status: 409 });
    }
  } else {
    return badRequest();
  }
  return Response.json(await listBuildings(auth.db, siteUrl(request)));
}
