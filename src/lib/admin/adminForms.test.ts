import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsv } from "./csv.ts";
import { validateBanner, validateBuildingLead, validateBusinessLead, validateCommission, validateNotification } from "./validate.ts";

test("csv: BOM, CRLF, quoting, formula injection defused", () => {
  const csv = toCsv(["שם", "סכום"], [["פיצה, מרגריטה", 120.5], ['אמר "שלום"', null], ["=HYPERLINK(1)", -5]]);
  assert.ok(csv.startsWith("﻿שם,סכום\r\n"));
  assert.ok(csv.includes('"פיצה, מרגריטה",120.5\r\n'));
  assert.ok(csv.includes('"אמר ""שלום""",\r\n'));
  assert.ok(csv.includes("'=HYPERLINK(1),-5\r\n")); // numbers stay numbers, formulas become text
});

test("admin forms: leads, commission, banners, notifications", () => {
  const b = validateBuildingLead({ address: " ברנר 7 ", city: "פתח תקווה", committeePhone: "052-1234567", apartmentCount: "30", pipeline: "lead" });
  assert.ok(b.ok && b.data.committeePhone === "0521234567" && b.data.address === "ברנר 7");
  const badB = validateBuildingLead({ address: "", city: "x", apartmentCount: 0, pipeline: "won" });
  assert.ok(!badB.ok && Object.keys(badB.errors).sort().join() === "address,apartmentCount,pipeline");

  const biz = validateBusinessLead({ name: "אופטיקה", category: "health", address: "רוטשילד 70", city: "פתח תקווה", contactName: "רון", phone: "03-1234567", email: "Ron@Example.com" });
  assert.ok(biz.ok && biz.data.email === "ron@example.com");
  assert.ok(!validateBusinessLead({ ...biz, category: "cars", email: "x" }).ok);

  assert.equal(validateCommission("7.5"), 7.5);
  assert.equal(validateCommission(4), 4);
  for (const bad of ["-1", "101", "5.555", "abc"]) assert.equal(validateCommission(bad), null, bad);

  const banner = validateBanner({ title: "סתיו בשכונה", imageUrl: "", businessId: "", sort: "2" });
  assert.ok(banner.ok && banner.data.businessId === null && banner.data.active && banner.data.sort === 2);
  assert.ok(!validateBanner({ title: "x".repeat(61) }).ok);

  const n = validateNotification({ title: "הטבה חדשה", body: "גלידה ב-15% הנחה", target: "city", city: "פתח תקווה", buildingId: "junk" });
  assert.ok(n.ok && n.data.city === "פתח תקווה" && n.data.buildingId === null);
  assert.ok(!validateNotification({ title: "הי", body: "x", target: "building", buildingId: "nope" }).ok);
});
