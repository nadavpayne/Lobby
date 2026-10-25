import assert from "node:assert/strict";
import { test } from "node:test";
import { generateCode, isValidCode } from "./codes.ts";
import { currentPeriod, nextPeriodStart } from "./period.ts";

test("generated codes are valid and varied", () => {
  const codes = new Set(Array.from({ length: 500 }, generateCode));
  for (const c of codes) assert.ok(isValidCode(c), c);
  assert.ok(codes.size > 490);
});

test("period follows Israel time across the month boundary", () => {
  assert.equal(currentPeriod(new Date("2026-10-31T22:30:00Z")), "2026-11"); // 00:30 Nov 1 in Israel (UTC+2)
  assert.equal(currentPeriod(new Date("2026-10-31T20:00:00Z")), "2026-10");
});

test("benefits renew on the 1st of next month, Israel time", () => {
  assert.equal(nextPeriodStart(new Date("2026-10-25T10:00:00Z")), "2026-11-01");
  assert.equal(nextPeriodStart(new Date("2026-12-31T22:30:00Z")), "2027-02-01"); // 00:30 Jan 1 in Israel (UTC+2)
  assert.equal(nextPeriodStart(new Date("2026-12-15T10:00:00Z")), "2027-01-01");
});
