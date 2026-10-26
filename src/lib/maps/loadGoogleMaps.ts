// Loads the Google Maps JavaScript API once, only when a map is actually shown (each load is billed).
// In the native app this is where the Capacitor Google Maps SDK would be swapped in.

type LatLng = { lat: number; lng: number };

export interface GoogleMap {
  setCenter(p: LatLng): void;
  fitBounds(bounds: unknown, padding?: number): void;
}

export interface GoogleMarker {
  setPosition(p: LatLng): void;
  setMap(map: GoogleMap | null): void;
  addListener(event: "dragend" | "click", fn: (e?: { latLng: { lat(): number; lng(): number } }) => void): void;
}

/** The small part of google.maps that MapView uses. */
export interface GoogleMaps {
  Map: new (el: HTMLElement, options: Record<string, unknown>) => GoogleMap;
  Marker: new (options: Record<string, unknown>) => GoogleMarker;
  LatLngBounds: new () => { extend(p: LatLng): void };
  SymbolPath: { CIRCLE: unknown };
}

/** The browser key; maps are off when it isn't set. */
export const MAPS_WEB_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_WEB_KEY ?? "";

let loading: Promise<GoogleMaps> | null = null;

/** Resolves with google.maps (Hebrew, Israel region). */
export function loadGoogleMaps(): Promise<GoogleMaps> {
  loading ??= new Promise((resolve, reject) => {
    const w = window as unknown as { google?: { maps: GoogleMaps }; __lobbyMapsReady?: () => void };
    w.__lobbyMapsReady = () => resolve(w.google!.maps);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${new URLSearchParams({ key: MAPS_WEB_KEY, v: "weekly", language: "he", region: "IL", callback: "__lobbyMapsReady" })}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}
