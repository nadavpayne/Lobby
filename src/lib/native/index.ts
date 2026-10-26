import { Capacitor } from "@capacitor/core";
import { appHaptics, appLinks, appQrScanner, appScreen } from "./capacitor/device";
import { appPush } from "./capacitor/push";
import type { Native, Platform } from "./types";
import { webHaptics, webLinks, webScreen } from "./web/device";
import { webGeolocation } from "./web/geolocation";
import { webPush } from "./web/push";
import { webQrScanner } from "./web/qrScanner";
import { webShare } from "./web/share";

export type * from "./types";

const isApp = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform() as Platform;

/** Device features for the current platform: native plugins inside the iOS and Android apps, web APIs in a browser. */
export const native: Native = {
  platform,
  isApp,
  // shortcut: Android push needs Firebase (google-services.json), without it registering crashes the app; until then
  // Android uses the "unsupported" stub. Add Firebase and FCM sending before the Google Play launch.
  push: platform === "ios" ? appPush : webPush,
  geolocation: webGeolocation, // the web API also works inside the app's web view
  qrScanner: isApp ? appQrScanner : webQrScanner,
  share: webShare, // navigator.share opens the iOS share sheet inside the app too
  screen: isApp ? appScreen : webScreen,
  haptics: isApp ? appHaptics : webHaptics,
  links: isApp ? appLinks : webLinks,
};
