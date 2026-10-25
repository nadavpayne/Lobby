import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeIsraeliPhone, validateJoin } from "./validateJoin.ts";

const valid = {
  name: " קפה הפינה ",
  category: "restaurants",
  subcategories: ["cafe"],
  tags: ["kosher", "kosher"],
  address: "הרצל 10",
  city: "תל אביב",
  contactName: "דנה",
  phone: "+972 52-123-4567",
  email: "Dana@Example.com",
  discountPercent: 10,
  description: "10% הנחה על כל התפריט",
  terms: "",
  acceptTerms: true,
};

test("accepts and normalizes a valid payload", () => {
  const result = validateJoin(valid);
  assert.ok(result.ok);
  assert.equal(result.data.name, "קפה הפינה");
  assert.equal(result.data.phone, "0521234567");
  assert.equal(result.data.email, "dana@example.com");
  assert.equal(result.data.terms, null);
  assert.deepEqual(result.data.subcategories, ["cafe"]);
  assert.deepEqual(result.data.tags, ["kosher"]); // de-duplicated
});

test("subcategories: 1–2 of the chosen primary; none for a primary without any", () => {
  const errorFor = (patch: object) => { const r = validateJoin({ ...valid, ...patch }); return r.ok ? null : r.errors.subcategories ?? null; };
  assert.equal(errorFor({ subcategories: "pizzeria" }), null); // a single value from a form is fine
  assert.equal(errorFor({ subcategories: ["cafe", "bar_pub"] }), null);
  assert.ok(errorFor({ subcategories: [] }));
  assert.ok(errorFor({ subcategories: ["cafe", "bar_pub", "pizzeria"] }));
  assert.ok(errorFor({ subcategories: ["barber"] })); // belongs to beauty, not restaurants
  assert.equal(errorFor({ category: "other", subcategories: [] }), null);
  assert.ok(errorFor({ category: "other", subcategories: ["cafe"] }));
});

test("tags must come from the list", () => {
  assert.ok(validateJoin({ ...valid, tags: ["delivery", "open_shabbat"] }).ok);
  const r = validateJoin({ ...valid, tags: ["vegan"] });
  assert.ok(!r.ok && r.errors.tags);
});

test("rejects bad fields with per-field errors", () => {
  const result = validateJoin({ ...valid, category: "toString", discountPercent: 0, acceptTerms: "true", name: "" });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["acceptTerms", "category", "discountPercent", "name"]);
});

test("rejects non-object bodies", () => {
  assert.ok(!validateJoin(null).ok);
  assert.ok(!validateJoin("x").ok);
});

test("normalizes Israeli phone numbers", () => {
  assert.equal(normalizeIsraeliPhone("03-1234567"), "031234567");
  assert.equal(normalizeIsraeliPhone("052 123 4567"), "0521234567");
  assert.equal(normalizeIsraeliPhone("12345"), null);
});
