# Lobby (לובי)

Closed benefits club for apartment buildings. Next.js (App Router) + Tailwind + Supabase.

## Setup

1. `npm install`
2. Create a Supabase project, then run `supabase/migrations/*.sql` in order (SQL Editor, or `npx supabase db push`).
3. Copy `.env.example` to `.env.local` and fill in the keys.
4. `npm run dev` and open http://localhost:3000
5. `npm run seed:demo` creates the demo building/business and prints the demo terminal link, PIN and code.
   In the terminal, "איפוס הדגמה" makes the demo code valid again between meetings.

`npm test` runs the unit tests; `npm run icons` regenerates the PWA icons from `public/logo.svg`.

## Addresses and maps

Every address in Lobby is picked from a list (Google Places, Israel, Hebrew) and saved with a Google place ID, our own
normalized fields (`street`, `house_number`, `city`, …) and a PostGIS point (`location`, derived from `lat`/`lng`).
Off until `GOOGLE_MAPS_SERVER_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY` are set; forms then take free text as before.

- `src/lib/address/` — the provider layer. The app never calls Google directly: the browser calls
  `/api/address/autocomplete` and `/api/address/resolve`, and forms send only a `placeId`, which the server resolves
  itself (`addressFromForm`). Lookups are cached by place ID (`place_cache`), and every billable call is logged
  (`google_api_log`) with a daily cap just under the Google Cloud quotas.
- `src/components/address/AddressInput.tsx` — the one address field; `MapView.tsx` — the one map component.
- Google's terms: lat/lng may be kept 30 days (place IDs forever), so `geo_fetched_at` records when to refresh, and
  Places data may only be shown on a Google map.
- `scripts/backfill-geo.ts` — one-time geocoding of rows that have no place yet; prints the rows to fix by hand.

**Adding a radius feature** (e.g. "deals near you" notifications, a business's reach): radius queries run in our
database, never through Google. Call `nearbyBusinesses(db, point, radiusMeters, categoryId?)` from
`src/lib/geo/nearby.ts` (the SQL function `nearby_businesses` counts a business as near if its storefront or any
branch is within the radius). A resident's radius is `residents.radius_preference` (`Membership.radiusMeters`,
default 1 km), so letting residents choose a radius is only a settings field.

**Adding a second address provider** (e.g. Photon + OpenStreetMap): implement `AddressProvider` from
`src/lib/address/types.ts` (`autocomplete`, `resolve`, `findPlaceId`) and return it from `getAddressProvider()` in
`src/lib/address/resolve.ts`. Stored rows keep working because they hold our own normalized address and point. Switching
the map away from Google also means re-geocoding with the new provider (run the backfill), since Google data may only
appear on Google maps.
