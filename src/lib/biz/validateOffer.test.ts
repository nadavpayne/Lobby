import assert from "node:assert/strict";
import { test } from "node:test";
import { endOfIsraelDay, startOfIsraelDay, toIsraelDay, validateOffer } from "./validateOffer.ts";

const good = { title: " 10% הנחה על כל התפריט ", description: "על כל המנות", terms: "", discountPercent: "10", category: "restaurants", startsOn: "", endsOn: "2026-12-31" };

test("offer form: valid input is cleaned, bad fields get Hebrew errors", () => {
  const r = validateOffer(good);
  assert.ok(r.ok);
  assert.deepEqual(r.data, { title: "10% הנחה על כל התפריט", description: "על כל המנות", terms: null, discountPercent: 10, category: "restaurants", startsOn: null, endsOn: "2026-12-31" });

  const bad = validateOffer({ ...good, title: "x", discountPercent: 0, category: "cars", startsOn: "2026-12-01", endsOn: "2026-11-01" });
  assert.ok(!bad.ok);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["category", "discountPercent", "endsOn", "title"]);
});

test("offer dates: Israel midnight in summer and winter, and back", () => {
  assert.equal(startOfIsraelDay("2026-08-01"), "2026-08-01T00:00:00+03:00");
  assert.equal(startOfIsraelDay("2026-12-01"), "2026-12-01T00:00:00+02:00");
  assert.equal(endOfIsraelDay("2026-12-31"), "2026-12-31T23:59:59+02:00");
  assert.equal(toIsraelDay("2026-11-30T22:30:00Z"), "2026-12-01");
  assert.equal(toIsraelDay(null), null);
});
