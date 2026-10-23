import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeIsraeliPhone, validateJoin } from "./validateJoin.ts";

const valid = {
  name: " קפה הפינה ",
  category: "food",
  address: "הרצל 10, תל אביב",
  contactName: "דנה",
  phone: "+972 52-123-4567",
  email: "Dana@Example.com",
  discountPercent: 10,
  description: "10% הנחה על כל התפריט",
  terms: "",
  pin: "1234",
  acceptTerms: true,
};

test("accepts and normalizes a valid payload", () => {
  const result = validateJoin(valid);
  assert.ok(result.ok);
  assert.equal(result.data.name, "קפה הפינה");
  assert.equal(result.data.phone, "0521234567");
  assert.equal(result.data.email, "dana@example.com");
  assert.equal(result.data.terms, null);
});

test("rejects bad fields with per-field errors", () => {
  const result = validateJoin({ ...valid, category: "toString", pin: "12a4", discountPercent: 5, acceptTerms: "true", name: "" });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["acceptTerms", "category", "discountPercent", "name", "pin"]);
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
