import assert from "node:assert/strict";
import { test } from "node:test";
import { splitBill } from "../qr/money.ts";
import { REPORTS_PER_MONTH } from "./config.ts";
import { reportBlock, validateDispute, type ReportContext } from "./rules.ts";
import { disputeSignals } from "./signals.ts";
import { buildStatement } from "./statement.ts";

const ctx = (o: Partial<ReportContext> = {}): ReportContext => ({
  redemption: { apartmentId: "apt1", status: "redeemed", redeemedAt: "2026-10-20T10:00:00Z", billAgorot: 30000 },
  reporterApartmentId: "apt1",
  hasDispute: false,
  reportsThisMonth: 0,
  now: new Date("2026-10-25T10:00:00Z"),
  ...o,
});

test("report window: 7 days after the redemption, then closed", () => {
  assert.equal(reportBlock(ctx()), null);
  assert.equal(reportBlock(ctx({ now: new Date("2026-10-27T09:59:59Z") })), null);
  assert.equal(reportBlock(ctx({ now: new Date("2026-10-27T10:00:00Z") })), "WINDOW_CLOSED");
});

test("report blocked: voided, other apartment, second dispute, rate limit", () => {
  assert.equal(reportBlock(ctx({ redemption: { ...ctx().redemption, status: "voided" } })), "VOIDED");
  assert.equal(reportBlock(ctx({ reporterApartmentId: "apt2" })), "NOT_YOURS");
  assert.equal(reportBlock(ctx({ hasDispute: true })), "ALREADY_REPORTED");
  assert.equal(reportBlock(ctx({ reportsThisMonth: REPORTS_PER_MONTH - 1 })), null);
  assert.equal(reportBlock(ctx({ reportsThisMonth: REPORTS_PER_MONTH })), "RATE_LIMITED");
});

test("BILL_HIGHER needs a claimed amount above the recorded one", () => {
  assert.deepEqual(validateDispute({ reason: "BILL_HIGHER", claimedBill: "450" }, 30000), { ok: true, data: { reason: "BILL_HIGHER", claimedBillAgorot: 45000, note: null } });
  assert.equal(validateDispute({ reason: "BILL_HIGHER", claimedBill: "300" }, 30000).ok, false); // equal
  assert.equal(validateDispute({ reason: "BILL_HIGHER", claimedBill: "250" }, 30000).ok, false); // lower
  assert.equal(validateDispute({ reason: "BILL_HIGHER" }, 30000).ok, false); // missing
  assert.equal(validateDispute({ reason: "BILL_HIGHER", claimedBill: "-5" }, 30000).ok, false);
});

test("other reasons: amount optional, note trimmed and capped, reason required", () => {
  assert.deepEqual(validateDispute({ reason: "DISCOUNT_NOT_GIVEN", note: "  לא קיבלתי  " }, 30000), { ok: true, data: { reason: "DISCOUNT_NOT_GIVEN", claimedBillAgorot: null, note: "לא קיבלתי" } });
  assert.equal(validateDispute({ reason: "OTHER", claimedBill: "abc" }, 30000).ok, false);
  assert.equal(validateDispute({ reason: "OTHER", note: "x".repeat(501) }, 30000).ok, false);
  assert.equal(validateDispute({ reason: "MAYBE" }, 30000).ok, false);
});

test("correction math: snapshot rates, agorot, same as the database", () => {
  assert.deepEqual(splitBill(45000, 10, 5), { billAgorot: 45000, discountAgorot: 4500, paidAgorot: 40500, commissionAgorot: 2250 });
  assert.deepEqual(splitBill(12345, 15, 5, "net"), { billAgorot: 12345, discountAgorot: 1852, paidAgorot: 10493, commissionAgorot: 525 });
});

test("statement: a correction in the running month just changes its total", () => {
  const s = buildStatement([{ period: "2026-10", redemptions: 2, gmv: 750, commission: 37.5 }], []);
  assert.equal(s[0].charged, 37.5);
  assert.equal(s[0].adjustmentsAgorot, 0);
});

test("statement: a correction to a charged month is charged once, in the month it was made", () => {
  // September was charged at ₪15.00; a correction raised one bill so September's redemptions now total ₪22.50.
  const months = [
    { period: "2026-09", redemptions: 3, gmv: 450, commission: 22.5 },
    { period: "2026-10", redemptions: 1, gmv: 100, commission: 5 },
  ];
  const s = buildStatement(months, [{ period: "2026-09", applyPeriod: "2026-10", commissionDiffAgorot: 750 }]);
  const sep = s.find((m) => m.period === "2026-09")!;
  const oct = s.find((m) => m.period === "2026-10")!;
  assert.equal(sep.charged, 15); // unchanged: what was already charged
  assert.equal(oct.charged, 12.5); // 5 + 7.50 carried in
  assert.equal(oct.adjustmentsAgorot, 750);
  assert.equal(s.reduce((sum, m) => sum + m.charged, 0), 22.5 + 5); // total = real commission, counted once
});

test("statement: an adjustment into a month with no redemptions still shows up", () => {
  const s = buildStatement([{ period: "2026-08", redemptions: 1, gmv: 200, commission: 12 }], [{ period: "2026-08", applyPeriod: "2026-10", commissionDiffAgorot: -200 }]);
  assert.deepEqual(s.map((m) => [m.period, m.charged]), [["2026-10", -2], ["2026-08", 14]]);
});

test("signals: rate, corrections, peers, flag threshold", () => {
  const redemptions = [
    ...Array.from({ length: 20 }, () => ({ businessId: "a", billAgorot: 10000 })),
    ...Array.from({ length: 10 }, () => ({ businessId: "b", billAgorot: 30000 })),
    { businessId: "c", billAgorot: 50000 },
  ];
  const disputes = [
    { businessId: "a", status: "CORRECTED" as const, billDiffAgorot: 5000 },
    { businessId: "a", status: "OPEN" as const, billDiffAgorot: 0 },
    { businessId: "a", status: "DISMISSED" as const, billDiffAgorot: 0 },
    { businessId: "b", status: "OPEN" as const, billDiffAgorot: 0 },
  ];
  const peerGroup = new Map([["a", "cafe"], ["b", "cafe"], ["c", "bakery"]]);
  const s = new Map(disputeSignals({ redemptions, disputes, peerGroup }).map((x) => [x.businessId, x]));
  assert.equal(s.get("a")!.rate, 3 / 20);
  assert.equal(s.get("a")!.flagged, true); // 3 disputes, 15%
  assert.equal(s.get("a")!.corrections, 1);
  assert.equal(s.get("a")!.correctedAgorot, 5000);
  assert.equal(s.get("a")!.avgBillAgorot, 10000);
  assert.equal(s.get("a")!.peerAvgBillAgorot, 30000);
  assert.equal(s.get("b")!.flagged, false); // 1 dispute is below the minimum
  assert.equal(s.get("c")!.peerAvgBillAgorot, null); // no peers
});
