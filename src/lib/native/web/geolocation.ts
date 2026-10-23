import type { Geolocation } from "../types";

/** Browser Geolocation API wrapped in a promise; null on denial, timeout or no support. */
export const webGeolocation: Geolocation = {
  getCurrentPosition: () =>
    new Promise((resolve) => {
      if (!("geolocation" in navigator)) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    }),
};
