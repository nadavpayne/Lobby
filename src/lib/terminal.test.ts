import assert from "node:assert/strict";
import { test } from "node:test";
import { createBusinessToken, isBusinessTokenValid, readBusinessId } from "./businesses/token.ts";
import { calcRedemption, parseAmount } from "./redemptions/money.ts";

test("money: discount and commission both come from the full bill", () => {
  assert.deepEqual(calcRedemption(100, 10), { amount: 100, discountAmount: 10, commissionAmount: 5, payAmount: 90 });
  assert.deepEqual(calcRedemption(33.33, 15), { amount: 33.33, discountAmount: 5, commissionAmount: 1.67, payAmount: 28.33 });
  assert.equal(calcRedemption(100, 10, 7).commissionAmount, 7); // per-business contract rate
  assert.equal(parseAmount("1,200.5"), 1200.5);
  assert.equal(parseAmount("₪ 80"), 80);
  for (const bad of ["0", "-5", "12.345", "abc", "", "1e3", "200000"]) assert.equal(parseAmount(bad), null, bad);
});

test("token: valid only with the same PIN hash, untampered and unexpired", () => {
  const id = "3f9a1c0d-8e7b-4a2f-9c6d-5e4b3a2f1c0d";
  const token = createBusinessToken(id, "hashA", "secret");
  assert.equal(readBusinessId(token), id);
  assert.ok(isBusinessTokenValid(token, "hashA", "secret"));
  assert.ok(!isBusinessTokenValid(token, "hashB", "secret")); // PIN changed
  assert.ok(!isBusinessTokenValid(token, "hashA", "other-secret"));
  assert.ok(!isBusinessTokenValid(token.slice(0, -2) + "xx", "hashA", "secret"));
  assert.equal(readBusinessId(token, Date.now() + 181 * 864e5), null); // expired
  assert.equal(readBusinessId("garbage"), null);
});
