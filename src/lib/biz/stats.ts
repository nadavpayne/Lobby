import { currentPeriod } from "../period.ts";
import type { BizDashboard, WindowStats } from "./types.ts";

/** One redeemed purchase at the business (what the dashboard counts). */
export interface RedeemedRow {
  redeemedAt: string;
  amount: number;
  commission: number;
  /** Who came (null if the resident deleted their account). */
  customerId: string | null;
  building: string;
}

const israelDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });

/** "YYYY-MM-DD" in Israel time. */
export const dayOf = (d: Date | string) => israelDate.format(typeof d === "string" ? new Date(d) : d);

/** The Israel calendar day `offset` days from `day` ("YYYY-MM-DD" arithmetic at noon UTC, DST-proof). */
function addDays(day: string, offset: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + offset, 12)).toISOString().slice(0, 10);
}

/** Sums count, bills and commission. */
function sum(rows: RedeemedRow[]): WindowStats {
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    redemptions: rows.length,
    gmv: round(rows.reduce((s, r) => s + r.amount, 0)),
    commission: round(rows.reduce((s, r) => s + r.commission, 0)),
  };
}

/** Dashboard numbers from all of the business's redeemed rows (commissionOwed is added by the caller). */
export function dashboardStats(rows: RedeemedRow[], now = new Date()): Omit<BizDashboard, "commissionOwed"> {
  const today = dayOf(now);
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = Sunday, the first day of the Israeli week
  const weekStart = addDays(today, -weekday);
  const period = currentPeriod(now);
  const withDay = rows.map((r) => ({ ...r, day: dayOf(r.redeemedAt) }));
  const thisMonth = withDay.filter((r) => r.day.startsWith(period));

  // A customer is new this month if their first redemption here ever is in this month.
  const firstVisit = new Map<string, string>();
  for (const r of withDay) {
    if (r.customerId && (!firstVisit.has(r.customerId) || r.day < firstVisit.get(r.customerId)!)) firstVisit.set(r.customerId, r.day);
  }
  const monthCustomers = new Set(thisMonth.flatMap((r) => (r.customerId ? [r.customerId] : [])));
  const newCustomers = [...monthCustomers].filter((c) => firstVisit.get(c)!.startsWith(period)).length;

  const perDay = new Map<string, number>();
  for (const r of withDay) perDay.set(r.day, (perDay.get(r.day) ?? 0) + 1);
  const daily = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(today, i - 29);
    return { date, redemptions: perDay.get(date) ?? 0 };
  });

  const since90 = addDays(today, -89);
  const perBuilding = new Map<string, number>();
  for (const r of withDay) if (r.day >= since90) perBuilding.set(r.building, (perBuilding.get(r.building) ?? 0) + 1);
  const topBuildings = [...perBuilding].map(([name, redemptions]) => ({ name, redemptions })).sort((a, b) => b.redemptions - a.redemptions).slice(0, 5);

  return {
    today: sum(withDay.filter((r) => r.day === today)),
    week: sum(withDay.filter((r) => r.day >= weekStart)),
    month: sum(thisMonth),
    newCustomers,
    returningCustomers: monthCustomers.size - newCustomers,
    daily,
    topBuildings,
  };
}
