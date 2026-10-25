export interface Point {
  lat: number;
  lng: number;
}

/** Straight-line distance in meters between two points (haversine). */
export function distanceMeters(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * 6_371_000 * Math.asin(Math.sqrt(h)));
}

/** Short Hebrew distance: "120 מ׳" (rounded to 10 m) under a kilometer, "1.4 ק״מ" above. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} מ׳`;
  return `${(meters / 1000).toFixed(1)} ק״מ`;
}
