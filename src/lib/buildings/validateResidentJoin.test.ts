import assert from "node:assert/strict";
import { test } from "node:test";
import { validateResidentJoin } from "./validateResidentJoin.ts";

test("accepts a name and an apartment inside the building", () => {
  assert.deepEqual(validateResidentJoin({ name: " דנה  כהן ", apartmentNumber: "7" }, 24), { ok: true, data: { name: "דנה כהן", apartmentNumber: 7 } });
});

test("rejects apartments outside 1..count and a missing name", () => {
  for (const apartmentNumber of [0, 25, 2.5, "x"]) assert.ok(!validateResidentJoin({ name: "דנה", apartmentNumber }, 24).ok, String(apartmentNumber));
  const r = validateResidentJoin({}, 24);
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.errors).sort(), ["apartmentNumber", "name"]);
});
