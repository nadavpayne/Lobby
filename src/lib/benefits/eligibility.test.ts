import assert from "node:assert/strict";
import { test } from "node:test";
import { eligibilityKey } from "./eligibility.ts";

const base = { apartmentId: "apt-1", residentId: "user-1", period: "2026-10" } as const;

test("eligibility keys: monthly by month, one-time per apartment or per resident, forever", () => {
  assert.equal(eligibilityKey({ ...base, benefitType: "monthly", oneTimeScope: "apartment" }), "apt:apt-1:m:2026-10");
  assert.notEqual(eligibilityKey({ ...base, benefitType: "monthly", oneTimeScope: "apartment" }), eligibilityKey({ ...base, benefitType: "monthly", oneTimeScope: "apartment", period: "2026-11" }));
  // One-time ignores the month: the same key in any month.
  assert.equal(eligibilityKey({ ...base, benefitType: "one_time", oneTimeScope: "apartment" }), "apt:apt-1:once");
  assert.equal(eligibilityKey({ ...base, benefitType: "one_time", oneTimeScope: "apartment", period: "2027-03" }), "apt:apt-1:once");
  // Resident scope: another resident of the same apartment gets a different key.
  assert.equal(eligibilityKey({ ...base, benefitType: "one_time", oneTimeScope: "resident" }), "res:user-1:once");
  assert.notEqual(eligibilityKey({ ...base, benefitType: "one_time", oneTimeScope: "resident" }), eligibilityKey({ ...base, benefitType: "one_time", oneTimeScope: "resident", residentId: "user-2" }));
  // A monthly key never collides with a one-time key: the monthly benefit used before a switch doesn't block the one-time one.
  assert.notEqual(eligibilityKey({ ...base, benefitType: "monthly", oneTimeScope: "apartment" }), eligibilityKey({ ...base, benefitType: "one_time", oneTimeScope: "apartment" }));
  // No resident id (deleted account): falls back to the apartment.
  assert.equal(eligibilityKey({ ...base, residentId: null, benefitType: "one_time", oneTimeScope: "resident" }), "apt:apt-1:once");
});
