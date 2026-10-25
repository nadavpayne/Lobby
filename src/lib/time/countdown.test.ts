import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCountdown, secondsUntil, spacedCode } from "./countdown.ts";

test("countdown: seconds left, m:ss, spaced code", () => {
  const now = Date.parse("2026-10-25T10:00:00Z");
  assert.equal(secondsUntil("2026-10-25T10:10:00Z", now), 600);
  assert.equal(secondsUntil("2026-10-25T10:00:00.400Z", now), 1); // rounds up: never shows 0 while still valid
  assert.equal(secondsUntil("2026-10-25T09:59:00Z", now), 0);
  assert.equal(formatCountdown(600), "10:00");
  assert.equal(formatCountdown(65), "1:05");
  assert.equal(spacedCode("246824"), "246 824");
  assert.equal(spacedCode("DEMA24"), "DEMA24");
});
