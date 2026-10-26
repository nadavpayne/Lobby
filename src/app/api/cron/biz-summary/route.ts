import { connection } from "next/server";
import { sendBizSummaries } from "@/lib/push/events";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/cron/biz-summary — Vercel Cron, daily: pushes the opt-in daily redemption summary to business owners. */
export async function GET(request: Request) {
  await connection();
  // Vercel sends "Authorization: Bearer $CRON_SECRET"; anyone else is refused.
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json({ owners: await sendBizSummaries(createAdminClient()) });
}
