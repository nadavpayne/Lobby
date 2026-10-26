import assert from "node:assert/strict";
import { test } from "node:test";
import { parseGooglePlace, parseGoogleSuggestions } from "./google.ts";
import { addressProblem, validPin } from "./rules.ts";

const herzl10 = {
  id: "ChIJ-herzl10",
  formattedAddress: "הרצל 10, תל אביב-יפו, ישראל",
  location: { latitude: 32.0629, longitude: 34.7705 },
  addressComponents: [
    { longText: "10", types: ["street_number"] },
    { longText: "הרצל", types: ["route"] },
    { longText: "תל אביב-יפו", types: ["locality", "political"] },
    { longText: "6578101", types: ["postal_code"] },
  ],
};

test("a picked suggestion becomes Lobby's normalized address", () => {
  assert.deepEqual(parseGooglePlace(herzl10), {
    providerPlaceId: "ChIJ-herzl10", lat: 32.0629, lng: 34.7705, street: "הרצל", houseNumber: "10",
    city: "תל אביב-יפו", postalCode: "6578101", formattedAddress: "הרצל 10, תל אביב-יפו, ישראל",
  });
  assert.equal(addressProblem(parseGooglePlace(herzl10)), null);
});

test("an address without a house number is rejected", () => {
  const street = parseGooglePlace({ ...herzl10, addressComponents: herzl10.addressComponents.filter((c) => !c.types.includes("street_number")) });
  assert.equal(street.houseNumber, "");
  assert.match(addressProblem(street)!, /מספר בית/);
});

test("a place with no city falls back to the district level, and no city at all is rejected", () => {
  const district = parseGooglePlace({ ...herzl10, addressComponents: [...herzl10.addressComponents.slice(0, 2), { longText: "מועצה", types: ["administrative_area_level_2"] }] });
  assert.equal(district.city, "מועצה");
  assert.match(addressProblem({ ...district, city: "" })!, /עיר/);
});

test("a place without a location is an error, not a silent 0,0", () => {
  assert.throws(() => parseGooglePlace({ id: "x", addressComponents: [] }));
});

test("suggestions keep only rows with a place ID", () => {
  const rows = parseGoogleSuggestions({
    suggestions: [
      { placePrediction: { placeId: "a", structuredFormat: { mainText: { text: "הרצל 10" }, secondaryText: { text: "תל אביב-יפו" } } } },
      { placePrediction: {} },
      {},
    ],
  });
  assert.deepEqual(rows, [{ placeId: "a", main: "הרצל 10", secondary: "תל אביב-יפו" }]);
});

test("the owner's dragged pin is kept only when it's a real point near the address", () => {
  const shop = { lat: 32.0629, lng: 34.7705 };
  assert.deepEqual(validPin(shop, { lat: 32.0631, lng: 34.7707 }), { lat: 32.0631, lng: 34.7707 }); // ~30 m
  assert.equal(validPin(shop, { lat: 32.08, lng: 34.7705 }), null); // ~2 km away
  assert.equal(validPin(shop, { lat: "32", lng: 34.77 }), null);
  assert.equal(validPin(shop, null), null);
});
