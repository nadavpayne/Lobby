// Loads the Google Maps JavaScript API once, only when a map is actually shown (each load is billed).
// In the native app this is where the Capacitor Google Maps SDK would be swapped in.

/** The small part of google.maps that MapView uses. */
export interface GoogleMaps {
  Map: new (el: HTMLElement, options: Record<string, unknown>) => { setCenter(p: LatLng): void };
  Marker: new (options: Record<string, unknown>) => {
    setPosition(p: LatLng): void;
    addListener(event: "dragend", fn: (e: { latLng: { lat(): number; lng(): number } }) => void): void;
  };
}

type LatLng = { lat: number; lng: number };

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
