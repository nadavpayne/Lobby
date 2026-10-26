import { after, connection } from "next/server";
import { correctDispute, dismissDispute, listDisputes, markInReview, signalsForPeriod, type DisputeFilters } from "@/lib/disputes/admin";
import { DISPUTE_REASONS, type DisputeStatus } from "@/lib/disputes/types";
import { notifyDisputeResolved } from "@/lib/push/events";
import { parseBillAgorot } from "@/lib/qr/money";
import { badRequest, isUuid, requireAdmin } from "../requireAdmin";

const STATUSES: DisputeStatus[] = ["OPEN", "IN_REVIEW", "CORRECTED", "DISMISSED"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Reads the queue filters from the URL, dropping anything malformed (default: open + in review). */
function parseFilters(url: URL): DisputeFilters {
  const p = url.searchParams;
  const status = p.get("status");
  const day = (v: string | null) => (v && DAY.test(v) ? v : null);
  return {
    status: status === "all" ? "all" : STATUSES.find((s) => s === status) ?? "active",
    businessId: isUuid(p.get("business")) ? p.get("business") : null,
    reason: DISPUTE_REASONS.find((r) => r === p.get("reason")) ?? null,
    from: day(p.get("from")),
    to: day(p.get("to")),
  };
}

/** GET /api/admin/disputes — the queue (?status&business&reason&from&to), or ?signals=YYYY-MM for per-business dispute rates. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const url = new URL(request.url);
  const signals = url.searchParams.get("signals");
  if (signals !== null) {
    if (!/^\d{4}-\d{2}$/.test(signals)) return badRequest();
    return Response.json(await signalsForPeriod(auth.db, signals));
  }
  return Response.json(await listDisputes(auth.db, parseFilters(url)));
}

/** POST /api/admin/disputes — { action: "review" | "correct" (bill, note?) | "dismiss" (note), id } → { ok }. */
export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.id)) return badRequest();
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";

  let outcome;
  if (body.action === "review") outcome = await markInReview(auth.db, body.id, auth.userId);
  else if (body.action === "correct") {
    const bill = parseBillAgorot(body.bill);
    if (bill === null) return badRequest({ bill: "סכום לא תקין" });
    outcome = await correctDispute(auth.db, body.id, auth.userId, bill, note || null);
  } else if (body.action === "dismiss") {
    if (note.length < 2) return badRequest({ note: "צריך לכתוב לדייר למה הדיווח נדחה" });
    outcome = await dismissDispute(auth.db, body.id, auth.userId, note);
  } else return badRequest();

  // Corrected or dismissed: push to the resident who reported it.
  if (outcome.ok && body.action !== "review") after(() => notifyDisputeResolved(auth.db, body.id));
  return outcome.ok ? Response.json({ ok: true }) : Response.json({ error: outcome.error }, { status: outcome.status });
}
