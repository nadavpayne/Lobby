import { connection } from "next/server";
import { listLog, logCsv, parseLogFilters } from "@/lib/admin/redemptions";
import { requireAdmin } from "../requireAdmin";

const SCREEN_LIMIT = 300;
const CSV_LIMIT = 20_000;

/** GET /api/admin/redemptions?from=&to=&business=&building=&status=[&format=csv] — the redemptions log or its CSV export. */
export async function GET(request: Request) {
  await connection();
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;
  const url = new URL(request.url);
  const filters = parseLogFilters(url);
  if (url.searchParams.get("format") !== "csv") return Response.json(await listLog(auth.db, filters, SCREEN_LIMIT));
  return new Response(logCsv(await listLog(auth.db, filters, CSV_LIMIT)), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=lobby-redemptions.csv" },
  });
}
