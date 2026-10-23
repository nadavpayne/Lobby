import type { Native } from "./types";
import { webGeolocation } from "./web/geolocation";
import { webPush } from "./web/push";
import { webQrScanner } from "./web/qrScanner";
import { webShare } from "./web/share";

export type * from "./types";

/** Device features for the current platform. Capacitor: return native implementations here when Capacitor.isNativePlatform(). */
export const native: Native = {
  platform: "web",
  push: webPush,
  geolocation: webGeolocation,
  qrScanner: webQrScanner,
  share: webShare,
};
