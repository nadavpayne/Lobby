import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPin, verifyPin } from "./pin.ts";

test("verifies the right PIN only", () => {
  const stored = hashPin("4821");
  assert.ok(verifyPin("4821", stored));
  assert.ok(!verifyPin("4822", stored));
  assert.ok(!verifyPin("4821", "garbage"));
  assert.notEqual(hashPin("4821"), stored); // salted
});
