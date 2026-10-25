import assert from "node:assert/strict";
import { test } from "node:test";
import { currentPeriod } from "../period.ts";
import { formatBackupCode, generateBackupCode, normalizeBackupCode } from "./backupCode.ts";
import { classifyScan, type ScannedToken } from "./classify.ts";
import { parseBillAgorot, splitBill } from "./money.ts";
import { isQrPayload, readQr, signQr } from "./signing.ts";

const SECRET = "x".repeat(40);
const ID = "3f9a1c0d-8e7b-4a2f-9c6d-5e4b3a2f1c0d";

test("backup codes: alphabet, XXX-XXX format, typed input", () => {
  const codes = new Set(Array.from({ length: 300 }, generateBackupCode));
  assert.ok(codes.size > 295);
  for (const c of codes) assert.match(c, /^[ACEFHJKMNPRTWXY3479]{6}$/);
  assert.equal(formatBackupCode("HAPPY7"), "HAP-PY7");
  assert.equal(normalizeBackupCode(" hap-py7 "), "HAPPY7");
  assert.equal(normalizeBackupCode("HAPPY0"), null); // 0 is a look-alike
  assert.equal(normalizeBackupCode("HAPPY"), null);
  assert.equal(normalizeBackupCode(7), null);
});

test("QR signing: round trip, forgery and tampering rejected", () => {
  const qr = signQr(ID, new Date("2026-10-25T10:05:00Z"), SECRET);
  assert.ok(isQrPayload(qr) && !qr.includes("@"));
  assert.equal(readQr(qr, SECRET), ID);
  assert.equal(readQr(qr, "y".repeat(40)), null); // other secret
  assert.equal(readQr(qr.replace(/\.(\d+)\./, (_, e) => `.${Number(e) + 600}.`), SECRET), null); // extended expiry
  assert.equal(readQr(qr.replace(ID, "00000000-0000-4000-8000-000000000000"), SECRET), null); // other token
  assert.equal(readQr("HAP-PY7", SECRET), null);
  assert.equal(readQr(null, SECRET), null);
});

test("scan results in the spec's order", () => {
  const now = new Date("2026-10-25T10:00:00Z");
  const t = (o: Partial<ScannedToken>): ScannedToken => ({ businessId: "b1", status: "active", expiresAt: "2026-10-25T10:04:00Z", ...o });
  assert.equal(classifyScan(null, "b1", false, now), "INVALID_CODE");
  assert.equal(classifyScan(t({ businessId: "b2" }), "b1", true, now), "WRONG_BUSINESS");
  assert.equal(classifyScan(t({ expiresAt: "2026-10-25T09:59:59Z" }), "b1", false, now), "CODE_EXPIRED");
  assert.equal(classifyScan(t({ expiresAt: "2026-10-25T10:00:00Z" }), "b1", false, now), "CODE_EXPIRED"); // exactly 5:00 is over
  assert.equal(classifyScan(t({ status: "replaced" }), "b1", false, now), "CODE_EXPIRED");
  assert.equal(classifyScan(t({ status: "used" }), "b1", false, now), "CODE_ALREADY_USED");
  assert.equal(classifyScan(t({ status: "used", expiresAt: "2026-10-25T09:00:00Z" }), "b1", false, now), "CODE_EXPIRED"); // expiry is checked first
  assert.equal(classifyScan(t({}), "b1", true, now), "ALREADY_REDEEMED_THIS_MONTH");
  assert.equal(classifyScan(t({}), "b1", false, now), "OK");
});

test("money in agorot: parse, split, gross vs net commission", () => {
  assert.equal(parseBillAgorot("84"), 8400);
  assert.equal(parseBillAgorot("1,200.5"), 120050);
  assert.equal(parseBillAgorot("₪ 0.07"), 7);
  for (const bad of ["0", "-5", "12.345", "abc", "", "1e3", "100000.01"]) assert.equal(parseBillAgorot(bad), null, bad);
  assert.deepEqual(splitBill(8400, 10, 5), { billAgorot: 8400, discountAgorot: 840, paidAgorot: 7560, commissionAgorot: 420 });
  assert.equal(splitBill(8400, 10, 5, "net").commissionAgorot, 378);
  assert.deepEqual(splitBill(3333, 15, 6.5), { billAgorot: 3333, discountAgorot: 500, paidAgorot: 2833, commissionAgorot: 217 }); // 499.95→500, 216.645→217
});

test("month boundary is Israel time: 23:58 on the 31st vs 00:01 on the 1st", () => {
  assert.equal(currentPeriod(new Date("2026-10-31T21:58:00Z")), "2026-10"); // 23:58 Israel (winter, UTC+2)
  assert.equal(currentPeriod(new Date("2026-10-31T22:01:00Z")), "2026-11"); // 00:01 Nov 1 Israel
});
