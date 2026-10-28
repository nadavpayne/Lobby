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
// The app runs the site's code, but Firebase is compiled into the Android app (google-services.json); asking for push
// in an app built without it crashes. So Android push waits for this site setting, switched on once installed apps
// have Firebase.
const ANDROID_PUSH = process.env.NEXT_PUBLIC_ANDROID_PUSH === "on";

/** Device features for the current platform: native plugins inside the iOS and Android apps, web APIs in a browser. */
export const native: Native = {
  platform,
  isApp,
  push: platform === "ios" || (platform === "android" && ANDROID_PUSH) ? appPush : webPush,
  geolocation: webGeolocation, // the web API also works inside the app's web view
  qrScanner: isApp ? appQrScanner : webQrScanner,
  share: webShare, // navigator.share opens the iOS share sheet inside the app too
  screen: isApp ? appScreen : webScreen,
  haptics: isApp ? appHaptics : webHaptics,
  links: isApp ? appLinks : webLinks,
};
