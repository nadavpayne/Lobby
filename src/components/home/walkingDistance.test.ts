import assert from "node:assert/strict";
import { test } from "node:test";
import taxonomy from "../../../data/business-categories.json" with { type: "json" };
import { BADGES, onRing, RINGS } from "./walkingDistance.ts";

const BADGE = 12; // badge size, % of the illustration
const LABEL = { w: 18, h: 7 }; // a time pill, generous

/** Badge centers for the full (9) or compact (6) illustration. */
const centers = (compactOnly: boolean) =>
  BADGES.filter((b) => !compactOnly || b.compact).map((b) => ({ id: b.id, ...onRing(RINGS[b.ring].radius, b.angle) }));
const labels = RINGS.map((r) => onRing(r.radius, 90));

test("every badge is a real subcategory id", () => {
  const ids = new Set(taxonomy.categories.flatMap((c) => c.subcategories.map((s) => s.id)));
  for (const b of BADGES) assert.ok(ids.has(b.id), b.id);
});

test("9 badges, 6 in the compact version, at least one per ring", () => {
  assert.equal(BADGES.length, 9);
  const compact = BADGES.filter((b) => b.compact);
  assert.equal(compact.length, 6);
  for (const ring of [0, 1, 2]) assert.ok(compact.some((b) => b.ring === ring));
});

test("badges don't overlap each other, the time labels, the center or the edge", () => {
  const all = centers(false);
  for (const [i, a] of all.entries()) {
    for (const b of all.slice(i + 1)) assert.ok(Math.hypot(a.left - b.left, a.top - b.top) > BADGE + 1, `${a.id} vs ${b.id}`);
    for (const l of labels) assert.ok(Math.abs(a.left - l.left) > (LABEL.w + BADGE) / 2 || Math.abs(a.top - l.top) > (LABEL.h + BADGE) / 2, `${a.id} vs a time label`);
    assert.ok(Math.hypot(a.left - 50, a.top - 50) > 12 + BADGE / 2, `${a.id} vs the center`);
    for (const v of [a.left, a.top]) assert.ok(v - BADGE / 2 >= 0 && v + BADGE / 2 <= 100, `${a.id} inside the square`);
  }
});
