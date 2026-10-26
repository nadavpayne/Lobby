import assert from "node:assert/strict";
import { test } from "node:test";
import { pathOf } from "../native/capacitor/device.ts";
import { parsePrefs, wants } from "./prefs.ts";

test("defaults: everything on except the business summary", () => {
  assert.equal(wants(null, "new_benefits"), true);
  assert.equal(wants(null, "redemptions"), true);
  assert.equal(wants(null, "disputes"), true);
  assert.equal(wants(null, "biz_summary"), false);
});

test("saved switches win over the defaults", () => {
  assert.equal(wants({ redemptions: false }, "redemptions"), false);
  assert.equal(wants({ biz_summary: true }, "biz_summary"), true);
  assert.equal(wants({ redemptions: false }, "disputes"), true);
});

test("parsePrefs keeps only known boolean switches", () => {
  assert.deepEqual(parsePrefs({ disputes: false, biz_summary: true, hacked: true, redemptions: "no" }), { disputes: false, biz_summary: true });
  assert.deepEqual(parsePrefs(null), {});
});

test("deep links: universal link or notification url → in-app path", () => {
  assert.equal(pathOf("https://lobby-mocha.vercel.app/i/abc123"), "/i/abc123");
  assert.equal(pathOf("https://lobby-mocha.vercel.app/app/wallet?x=1#d"), "/app/wallet?x=1#d");
  assert.equal(pathOf("/app/b/42"), "/app/b/42");
});
