import { connection } from "next/server";
import { bizRedemptionsCsv, listBizRedemptions, parseBizLogFilters } from "@/lib/biz/redemptionsLog";
import { voidRedemption } from "@/lib/qr/register";
import { requireBusinessOwner } from "../requireBusinessOwner";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** GET /api/biz/redemptions?from=&to=&cashier=[&format=csv] — owner only: the redemptions log with totals, or its CSV. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const url = new URL(request.url);
  const filters = parseBizLogFilters(url);
  if (url.searchParams.get("format") !== "csv") return Response.json(await listBizRedemptions(auth.db, auth.business.id, filters, 500));
  const { rows } = await listBizRedemptions(auth.db, auth.business.id, filters, 20_000);
  return new Response(bizRedemptionsCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=lobby-redemptions.csv" },
  });
}

/** POST /api/biz/redemptions — owner only (never a cashier): { id, reason } voids a redemption; it stays in the log, frees the month. */
export async function POST(request: Request) {
  const auth = await requireBusinessOwner(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (typeof body?.id !== "string" || !UUID.test(body.id) || reason.length < 2 || reason.length > 300) {
    return Response.json({ error: "צריך לכתוב סיבה לביטול (2–300 תווים)" }, { status: 400 });
  }
  const done = await voidRedemption(auth.db, auth.business.id, body.id, auth.userId, reason);
  return done ? Response.json({ ok: true }) : Response.json({ error: "המימוש לא נמצא או כבר בוטל" }, { status: 404 });
}
