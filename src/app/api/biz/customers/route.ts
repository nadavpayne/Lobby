import { connection } from "next/server";
import { cleanNote, listCustomers, saveNote } from "@/lib/biz/customers";
import { requireBusinessOwner } from "../requireBusinessOwner";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** GET /api/biz/customers — Lobby customers of my business with my notes and tags. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  return Response.json(await listCustomers(auth.db, auth.business.id));
}

/** POST /api/biz/customers — { residentId, note, tags } saves my note for one of my customers. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  const clean = cleanNote(body?.note, body?.tags);
  if (!clean || typeof body?.residentId !== "string" || !UUID.test(body.residentId)) return Response.json({ error: "בקשה לא תקינה" }, { status: 400 });
  const saved = await saveNote(auth.db, auth.business.id, body.residentId, clean.note, clean.tags);
  return saved ? Response.json({ ok: true }) : Response.json({ error: "הלקוח לא נמצא" }, { status: 404 });
}
