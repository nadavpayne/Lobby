import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanHours, isValidPin, validateProfile } from "./validateProfile.ts";

const good = {
  description: "", phone: "052-123-4567", address: " רוטשילד 60 ", logoUrl: "", coverUrl: "",
  hours: { sun: [["08:00", "21:00"]], fri: [["08:00", "14:00"]], sat: [] },
  branches: [{ name: "סניף כפר גנים", address: "אחד העם 18" }, { name: "", address: "" }],
};

test("profile: valid input is cleaned (phone, empty branch rows dropped)", () => {
  const r = validateProfile(good);
  assert.ok(r.ok);
  assert.equal(r.data.phone, "0521234567");
  assert.equal(r.data.address, "רוטשילד 60");
  assert.deepEqual(r.data.branches, [{ name: "סניף כפר גנים", address: "אחד העם 18" }]);
  assert.deepEqual(r.data.hours.mon, []);
});

test("profile: bad fields and hours are rejected", () => {
  const bad = validateProfile({ ...good, phone: "123", coverUrl: "http://x", branches: [{ name: "סניף", address: "" }] });
  assert.ok(!bad.ok);
  assert.deepEqual(Object.keys(bad.errors).sort(), ["branches", "coverUrl", "phone"]);
  assert.equal(cleanHours({ sun: [["21:00", "08:00"]] }), null); // closes before it opens
  assert.equal(cleanHours({ sun: [["8:00", "21:00"]] }), null); // HH:MM only
  assert.equal(cleanHours({ sun: [["08:00", "12:00"], ["16:00", "20:00"], ["21:00", "22:00"]] }), null); // max 2 ranges
  assert.ok(isValidPin("2468") && !isValidPin("246") && !isValidPin(2468));
});
