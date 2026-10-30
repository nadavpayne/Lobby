import assert from "node:assert/strict";
import { test } from "node:test";
import { calcRedemption } from "./generate.ts";
import { lastMonths, planRedemptions, seededRandom, type PlanApartment, type PlanBusiness } from "./generate.ts";

const now = new Date("2026-10-25T10:00:00Z");
const businesses: PlanBusiness[] = [
  { discount: 10, commission: 5, bill: [50, 200], weight: 5, liveFrom: new Date("2026-01-01") },
  { discount: 15, commission: 7, bill: [20, 80], weight: 3, liveFrom: new Date("2026-10-01") },
  { discount: 10, commission: 4, bill: [100, 300], weight: 1, liveFrom: new Date("2026-01-01") },
];
const apartments: PlanApartment[] = Array.from({ length: 40 }, (_, i) => ({ key: `a${i}`, residentIdx: i, activity: 1 }));

test("seed: last three months end with the current one", () => {
  assert.deepEqual(lastMonths(now, 3), ["2026-08", "2026-09", "2026-10"]);
  assert.deepEqual(lastMonths(new Date("2026-01-15T10:00:00Z"), 2), ["2025-12", "2026-01"]);
});

test("seed: history obeys one redemption per apartment per business per month", () => {
  const plan = planRedemptions(apartments, businesses, lastMonths(now, 3), now, seededRandom(1));
  assert.ok(plan.length > 100);

  const slots = new Set<string>();
  for (const r of plan) {
    const slot = `${r.apartmentKey}|${r.businessIdx}|${r.period}`;
    assert.ok(!slots.has(slot), `duplicate ${slot}`);
    slots.add(slot);

    assert.ok(r.issuedAt < now, "nothing in the future");
    assert.ok(r.issuedAt >= businesses[r.businessIdx].liveFrom, "only while the offer is live");
    if (r.status === "redeemed") {
      const b = businesses[r.businessIdx];
      const money = calcRedemption(r.amount!, b.discount, b.commission);
      assert.equal(r.discountAmount, money.discountAmount);
      assert.equal(r.commissionAmount, money.commissionAmount);
      assert.ok(r.redeemedAt! > r.issuedAt && r.redeemedAt! < r.expiresAt, "redeemed inside the 10 minutes");
    }
  }
});

test("seed: same seed gives the same data", () => {
  const a = planRedemptions(apartments, businesses, ["2026-09"], now, seededRandom(7));
  const b = planRedemptions(apartments, businesses, ["2026-09"], now, seededRandom(7));
  assert.deepEqual(a, b);
});
