import assert from "node:assert/strict";
import { test } from "node:test";
import { deletionNotice } from "./plan.ts";

test("resident: apartment link deleted, records kept anonymized, no business section", () => {
  const n = deletionNotice(["resident"], false);
  assert.equal(n.allowed, true);
  assert.ok(n.deleted.some((d) => d.includes("לדירה")));
  assert.ok(n.kept[0].includes("בלי שום קישור"));
  assert.deepEqual(n.business, []);
  assert.equal(n.committeeHandover, false);
});

test("business owner: business leaves the club, cashiers revoked, owed commission stays", () => {
  const n = deletionNotice(["business_owner"], false);
  assert.equal(n.business.length, 3);
  assert.ok(n.business.some((b) => b.includes("הקופאים")));
  assert.ok(n.business.some((b) => b.includes("לתשלום")));
  assert.ok(!n.deleted.some((d) => d.includes("לדירה")));
});

test("the only committee member gets the handover offer; one of several doesn't", () => {
  assert.equal(deletionNotice(["committee"], true).committeeHandover, true);
  assert.equal(deletionNotice(["committee"], false).committeeHandover, false);
  assert.equal(deletionNotice(["resident"], true).committeeHandover, false);
});

test("admin accounts can't be deleted from the app", () => {
  assert.equal(deletionNotice(["admin"], false).allowed, false);
});
