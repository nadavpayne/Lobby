import assert from "node:assert/strict";
import { test } from "node:test";
import { feedSections, heroOffers } from "./feedSections.ts";
import type { ResidentOffer } from "./types.ts";

const now = new Date("2026-10-25T10:00:00Z");

/** A minimal offer with overrides. */
function offer(id: string, o: Partial<ResidentOffer>): ResidentOffer {
  return {
    businessId: id, businessName: id, category: "food", address: "", businessDescription: null, logoUrl: null, coverUrl: null,
    lat: null, lng: null, hours: null, branches: [], title: "", discountPercent: 10, description: "", terms: null,
    startsAt: null, endsAt: null, joinedAt: "2026-01-01T00:00:00Z", distanceMeters: null, recentRedemptions: 0,
    remaining: null, state: "available", ...o,
  };
}

test("feed: sections pick and order the right offers", () => {
  const offers = [
    offer("busy", { recentRedemptions: 9, distanceMeters: 800, endsAt: "2026-12-31" }),
    offer("quiet", { recentRedemptions: 2, distanceMeters: 120 }),
    offer("fresh", { joinedAt: "2026-10-20T00:00:00Z" }),
    offer("soon", { state: "upcoming", startsAt: "2026-11-04T00:00:00Z", recentRedemptions: 50 }),
  ];
  const byKey = Object.fromEntries(feedSections(offers, now).map((s) => [s.key, s.offers.map((o) => o.businessId)]));

  assert.deepEqual(byKey.hot, ["busy", "quiet"]); // upcoming never counts as hot
  assert.deepEqual(byKey.new, ["fresh"]);
  assert.deepEqual(byKey.near, ["quiet", "busy"]);
  assert.deepEqual(byKey.upcoming, ["soon"]);
  assert.deepEqual(byKey.permanent, ["quiet", "fresh"]); // "busy" has an end date
  assert.deepEqual(heroOffers(offers).map((o) => o.businessId), ["busy", "quiet", "fresh"]);
});

test("feed: empty sections are dropped", () => {
  const keys = feedSections([offer("a", { endsAt: "2026-12-31" })], now).map((s) => s.key);
  assert.deepEqual(keys, []);
});
