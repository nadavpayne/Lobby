import assert from "node:assert/strict";
import { test } from "node:test";
import { dashboardStats, dayOf, type RedeemedRow } from "./stats.ts";

const now = new Date("2026-10-27T10:00:00Z"); // Tuesday 27.10 in Israel; week started Sunday 25.10

/** A redeemed row at an Israel-time moment. */
const row = (at: string, customerId: string | null, amount = 100, building = "רוטשילד 45"): RedeemedRow =>
  ({ redeemedAt: at, amount, commission: amount * 0.05, customerId, building });

test("dashboard: windows follow Israel time, new vs returning, daily series, top buildings", () => {
  const rows = [
    row("2026-10-26T22:30:00Z", "a", 200), // 00:30 Tue 27.10 in Israel (winter time, UTC+2) → today
    row("2026-10-25T08:00:00Z", "b"), // Sunday → this week
    row("2026-10-24T08:00:00Z", "c"), // Saturday → last week, this month
    row("2026-09-15T08:00:00Z", "b", 50, "הרצל 30"), // b came before → returning
    row("2026-07-01T08:00:00Z", "z", 80, "הרצל 30"), // older than 90 days
  ];
  const s = dashboardStats(rows, now);

  assert.equal(dayOf("2026-10-26T22:30:00Z"), "2026-10-27");
  assert.equal(dayOf("2026-10-26T21:30:00Z"), "2026-10-26");
  assert.deepEqual(s.today, { redemptions: 1, gmv: 200, commission: 10 });
  assert.equal(s.week.redemptions, 2);
  assert.deepEqual(s.month, { redemptions: 3, gmv: 400, commission: 20 });
  assert.equal(s.newCustomers, 2); // a, c
  assert.equal(s.returningCustomers, 1); // b
  assert.equal(s.daily.length, 30);
  assert.deepEqual(s.daily.at(-1), { date: "2026-10-27", redemptions: 1 });
  assert.equal(s.daily[0].date, "2026-09-28");
  assert.deepEqual(s.topBuildings, [{ name: "רוטשילד 45", redemptions: 3 }, { name: "הרצל 30", redemptions: 1 }]);
});
