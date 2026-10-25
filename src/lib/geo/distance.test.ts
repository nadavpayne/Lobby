import assert from "node:assert/strict";
import { test } from "node:test";
import { distanceMeters, formatDistance } from "./distance.ts";

test("distance: haversine in meters and Hebrew formatting", () => {
  // Rothschild 45 → Rothschild 60 in Petah Tikva, roughly 100 m apart.
  const d = distanceMeters({ lat: 32.0889, lng: 34.879 }, { lat: 32.0893, lng: 34.8801 });
  assert.ok(d > 80 && d < 130, `got ${d}`);
  assert.equal(distanceMeters({ lat: 32, lng: 34 }, { lat: 32, lng: 34 }), 0);

  assert.equal(formatDistance(4), "10 מ׳");
  assert.equal(formatDistance(347), "350 מ׳");
  assert.equal(formatDistance(1449), "1.4 ק״מ");
});
