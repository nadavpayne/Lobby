import assert from "node:assert/strict";
import { test } from "node:test";
import { normalize, searchOffers, wordForms } from "./search.ts";
import type { ResidentOffer } from "./types.ts";

const offer = (id: string, o: Partial<ResidentOffer>): ResidentOffer => ({
  businessId: id, businessName: id, category: "restaurants", subcategories: [], tags: [], address: "", businessDescription: null, logoUrl: null,
  coverUrl: null, lat: null, lng: null, hours: null, branches: [], title: "10% הנחה", discountPercent: 10, description: "", terms: null,
  startsAt: null, endsAt: null, joinedAt: "2026-01-01T00:00:00Z", distanceMeters: null, withinRadius: false, recentRedemptions: 0,
  remaining: null, state: "available", featured: false, ...o,
});

const offers = [
  offer("pizza", { businessName: "פיצה מרגריטה", subcategories: ["pizzeria"], tags: [], distanceMeters: 400 }),
  offer("fish", { businessName: "יוסף דגים", category: "food_grocery", subcategories: ["fish"], distanceMeters: 120 }),
  offer("cafe", { businessName: "קפה השכונה", subcategories: ["cafe"], description: "קפה ומאפים טריים", distanceMeters: 50 }),
  offer("barber", { businessName: "מספרת רוני", category: "beauty", subcategories: [], address: "רוטשילד 60", distanceMeters: 900 }),
];
const ids = (q: string, category: string | null = null, subcategory: string | null = null) =>
  searchOffers(offers, { query: q, category, subcategory }).map((o) => o.businessId);

test("normalize: niqqud, final letters, punctuation", () => {
  assert.equal(normalize("פִּיצָה!"), "פיצה");
  assert.equal(normalize("דגים"), "דגימ");
  assert.equal(normalize("  קפה,  ומאפה "), "קפה ומאפה");
});

test("word forms: prefixes and endings", () => {
  assert.ok(wordForms("בפיצה").includes("פיצ"));
  assert.ok(wordForms("דגימ").includes("דגימ"));
  assert.ok(wordForms("מספרה").includes("מספר"));
});

test("finds by business name, also with a prefix or another form", () => {
  assert.deepEqual(ids("פיצה"), ["pizza"]);
  assert.deepEqual(ids("בפיצה"), ["pizza"]);
  assert.deepEqual(ids("דגים"), ["fish"]);
  assert.deepEqual(ids("מספרה"), ["barber"]);
});

test("finds by category and subcategory words, not just names", () => {
  assert.deepEqual(ids("פיצרייה"), ["pizza"]);
  assert.deepEqual(ids("בית קפה"), ["cafe"]);
  assert.ok(ids("מסעדות").includes("pizza"));
});

test("every word must match; description and address count too", () => {
  assert.deepEqual(ids("קפה מאפים"), ["cafe"]);
  assert.deepEqual(ids("קפה פיצה"), ["pizza"]); // a pizzeria is in "מסעדות ובתי קפה"
  assert.deepEqual(ids("קפה דגים"), []);
  assert.deepEqual(ids("רוטשילד"), ["barber"]);
});

test("name hits rank above description hits", () => {
  const list = [offer("a", { businessName: "חנות", description: "גם קפה" }), offer("b", { businessName: "קפה טוב" })];
  assert.deepEqual(searchOffers(list, { query: "קפה", category: null, subcategory: null }).map((o) => o.businessId), ["b", "a"]);
});

test("category and subcategory filters; no words = nearest first", () => {
  assert.deepEqual(ids("", "restaurants"), ["cafe", "pizza"]);
  assert.deepEqual(ids("", "restaurants", "pizzeria"), ["pizza"]);
  assert.deepEqual(ids("", null), ["cafe", "fish", "pizza", "barber"]);
  assert.deepEqual(ids("פיצה", "food_grocery"), []);
});
