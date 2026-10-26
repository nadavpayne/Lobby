// Google Places API (New), server side only. No "server-only"/"@/" imports so scripts/backfill-geo.ts can use it.
import type { AddressProvider, AddressSuggestion, ResolvedAddress } from "./types.ts";

const API = "https://places.googleapis.com/v1";
// Essentials-tier fields only: no photos, ratings or other Pro/Enterprise fields.
const DETAILS_FIELDS = "id,formattedAddress,location,addressComponents";

interface GoogleComponent {
  longText?: string;
  types?: string[];
}

interface GooglePlace {
  id?: string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  addressComponents?: GoogleComponent[];
}

interface GoogleSuggestion {
  placePrediction?: { placeId?: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } };
}

/** Maps a Place Details response to Lobby's normalized address. */
export function parseGooglePlace(place: GooglePlace): ResolvedAddress {
  const part = (...types: string[]) =>
    types.map((t) => place.addressComponents?.find((c) => c.types?.includes(t))?.longText).find(Boolean) ?? "";
  const { latitude, longitude } = place.location ?? {};
  if (!place.id || typeof latitude !== "number" || typeof longitude !== "number") throw new Error("Google place without id/location");
  return {
    providerPlaceId: place.id,
    lat: latitude,
    lng: longitude,
    street: part("route"),
    houseNumber: part("street_number"),
    city: part("locality", "administrative_area_level_2"),
    postalCode: part("postal_code"),
    formattedAddress: place.formattedAddress ?? "",
  };
}

/** Maps an Autocomplete response to suggestion rows. */
export function parseGoogleSuggestions(json: { suggestions?: GoogleSuggestion[] }): AddressSuggestion[] {
  return (json.suggestions ?? []).flatMap(({ placePrediction: p }) =>
    p?.placeId ? [{ placeId: p.placeId, main: p.structuredFormat?.mainText?.text ?? "", secondary: p.structuredFormat?.secondaryText?.text ?? "" }] : [],
  );
}

/** Calls Google and throws on any non-2xx answer. */
async function call<T>(key: string, path: string, init: { body?: unknown; fieldMask?: string } = {}): Promise<T> {
  const res = await fetch(API + path, {
    method: init.body ? "POST" : "GET",
    headers: {
      "X-Goog-Api-Key": key,
      ...(init.body !== undefined && { "Content-Type": "application/json" }),
      ...(init.fieldMask && { "X-Goog-FieldMask": init.fieldMask }),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json() as Promise<T>;
}

/** Israel only, Hebrew results. */
export function googleAddressProvider(key: string): AddressProvider {
  return {
    async autocomplete(query, sessionToken) {
      const json = await call<{ suggestions?: GoogleSuggestion[] }>(key, "/places:autocomplete", {
        body: { input: query, sessionToken, languageCode: "he", includedRegionCodes: ["il"] },
      });
      return parseGoogleSuggestions(json);
    },
    async resolve(placeId, sessionToken) {
      const qs = new URLSearchParams({ languageCode: "he", regionCode: "il", ...(sessionToken && { sessionToken }) });
      return parseGooglePlace(await call<GooglePlace>(key, `/places/${encodeURIComponent(placeId)}?${qs}`, { fieldMask: DETAILS_FIELDS }));
    },
    async findPlaceId(text) {
      // Text Search with the place ID only is Google's free "IDs Only" SKU.
      const json = await call<{ places?: { id?: string }[] }>(key, "/places:searchText", {
        body: { textQuery: text, languageCode: "he", regionCode: "il" },
        fieldMask: "places.id",
      });
      return json.places?.[0]?.id ?? null;
    },
  };
}
