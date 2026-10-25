import assert from "node:assert/strict";
import { test } from "node:test";
import { canOpen, homeFor } from "./homeFor.ts";

test("roles: each account lands in its own app, admin wins", () => {
  assert.equal(homeFor([]), null);
  assert.equal(homeFor(["resident"]), "/app");
  assert.equal(homeFor(["committee"]), "/app");
  assert.equal(homeFor(["resident", "business_owner"]), "/biz");
  assert.equal(homeFor(["business_owner", "admin"]), "/admin");

  assert.ok(canOpen(["committee"], "/app"));
  assert.ok(!canOpen(["resident"], "/biz"));
  assert.ok(!canOpen(["business_owner"], "/admin"));
  assert.ok(canOpen(["resident", "business_owner"], "/app"));
});
