import assert from "node:assert/strict";
import { test } from "node:test";
import { businessLinks, otherApps } from "./accountMenu.ts";

test("account menu: each role sees only its own links", () => {
  assert.equal(businessLinks(["business_owner"])[0].href, "/biz");
  assert.deepEqual(businessLinks(["cashier"]).map((l) => l.href), ["/cashier"]);
  assert.deepEqual(businessLinks(["resident"]), []);
  assert.deepEqual(otherApps(["business_owner"]), []);
  assert.deepEqual(otherApps(["committee", "admin"]).map((l) => l.href), ["/app", "/admin"]);
});
