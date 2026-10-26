import { Capacitor } from "@capacitor/core";
import { appHaptics, appLinks, appQrScanner, appScreen } from "./capacitor/device";
import { appPush } from "./capacitor/push";
import type { Native } from "./types";
import { webHaptics, webLinks, webScreen } from "./web/device";
import { webGeolocation } from "./web/geolocation";
import { webPush } from "./web/push";
import { webQrScanner } from "./web/qrScanner";
import { webShare } from "./web/share";

export type * from "./types";

const isApp = Capacitor.isNativePlatform();

/** Device features for the current platform: native plugins inside the iOS app, web APIs in a browser. */
export const native: Native = {
  platform: isApp ? "ios" : "web",
  isApp,
  push: isApp ? appPush : webPush,
  geolocation: webGeolocation, // the web API also works inside the app's web view
  qrScanner: isApp ? appQrScanner : webQrScanner,
  share: webShare, // navigator.share opens the iOS share sheet inside the app too
  screen: isApp ? appScreen : webScreen,
  haptics: isApp ? appHaptics : webHaptics,
  links: isApp ? appLinks : webLinks,
};
