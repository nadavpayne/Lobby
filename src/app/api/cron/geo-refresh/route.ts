import { connection } from "next/server";
import { refreshStaleLocations } from "@/lib/address/refresh";
import { getAddressProvider } from "@/lib/address/resolve";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/cron/geo-refresh — Vercel Cron, daily: keeps stored coordinates within Google's 30-day limit. */
export async function GET(request: Request) {
  await connection();
  // Vercel sends "Authorization: Bearer $CRON_SECRET"; anyone else is refused.
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const provider = getAddressProvider();
  if (!provider) return Response.json({ skipped: "address lookup is off" });
  return Response.json(await refreshStaleLocations(createAdminClient(), provider));
}
