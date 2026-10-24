import assert from "node:assert/strict";
import { test } from "node:test";
import { validateBuilding } from "./validateBuilding.ts";

const valid = { address: "  הרצל   10 ", city: "תל אביב", apartmentCount: "24", name: "דנה", apartmentNumber: 7 };

test("accepts and cleans a valid building", () => {
  const r = validateBuilding(valid);
  assert.ok(r.ok);
  assert.deepEqual(r.data, { address: "הרצל 10", city: "תל אביב", apartmentCount: 24, name: "דנה", apartmentNumber: 7 });
});

test("own apartment must be within the building", () => {
  const r = validateBuilding({ ...valid, apartmentNumber: 25 });
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.errors), ["apartmentNumber"]);
});

test("rejects missing fields and bad counts", () => {
  const r = validateBuilding({ apartmentCount: 0, apartmentNumber: 1.5 });
  assert.ok(!r.ok);
  assert.deepEqual(Object.keys(r.errors).sort(), ["address", "apartmentCount", "apartmentNumber", "city", "name"]);
  assert.ok(!validateBuilding({ ...valid, apartmentCount: 501 }).ok);
  assert.ok(!validateBuilding(null).ok);
});
