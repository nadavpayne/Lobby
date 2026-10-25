import assert from "node:assert/strict";
import { test } from "node:test";
import { todayLine, weekRows, type WeekHours } from "./hours.ts";

const hours: WeekHours = { sun: [["08:00", "21:00"]], fri: [["08:00", "14:00"]], sat: [] };

test("hours: today follows Israel time, closed days say so", () => {
  const sundayMorning = new Date("2026-10-25T06:00:00Z"); // Sun 08:00 in Israel
  const saturdayNight = new Date("2026-10-24T22:30:00Z"); // already Sun 00:30 in Israel
  assert.equal(todayLine(hours, sundayMorning), "פתוח היום 08:00–21:00");
  assert.equal(todayLine(hours, saturdayNight), "פתוח היום 08:00–21:00");
  assert.equal(todayLine(hours, new Date("2026-10-24T10:00:00Z")), "סגור היום"); // Saturday

  const rows = weekRows(hours, sundayMorning);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows[0], { day: "ראשון", text: "08:00–21:00", today: true });
  assert.equal(rows[1].text, "סגור"); // Monday not listed
  assert.equal(rows[5].text, "08:00–14:00");
});
