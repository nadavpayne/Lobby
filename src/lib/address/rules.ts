import { distanceMeters, type Point } from "../geo/distance.ts";
import type { ResolvedAddress } from "./types.ts";

/** How far a business owner may drag the storefront pin from the picked address. */
export const MAX_PIN_MOVE_METERS = 300;

/** Why a picked address can't be used, in Hebrew, or null when it's a real building. */
export function addressProblem(a: ResolvedAddress): string | null {
  if (!a.street || !a.houseNumber) return "צריך כתובת מדויקת עם מספר בית. נסו להקליד גם את המספר ולבחור מהרשימה.";
  if (!a.city) return "לא מצאנו עיר בכתובת הזו. נסו לבחור כתובת אחרת מהרשימה.";
  return null;
}

/** The owner's dragged pin, if it's a valid point near the address; otherwise null (keep Google's point). */
export function validPin(a: Point, pin: unknown): Point | null {
  const p = pin as Partial<Point> | null;
  if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return null;
  const point = { lat: p.lat!, lng: p.lng! };
  return distanceMeters(a, point) <= MAX_PIN_MOVE_METERS ? point : null;
}

/** Lobby's DB columns for a picked address (same names on buildings, businesses and branches). */
export function placeColumns(a: ResolvedAddress, pin?: { lat: number; lng: number } | null) {
  return {
    address: `${a.street} ${a.houseNumber}`,
    city: a.city,
    lat: pin?.lat ?? a.lat,
    lng: pin?.lng ?? a.lng,
    place_id: a.providerPlaceId,
    street: a.street,
    house_number: a.houseNumber,
    postal_code: a.postalCode || null,
    formatted_address: a.formattedAddress,
    geo_fetched_at: new Date().toISOString(),
  };
}

export type PlaceColumns = ReturnType<typeof placeColumns> & { pin_moved?: boolean };
