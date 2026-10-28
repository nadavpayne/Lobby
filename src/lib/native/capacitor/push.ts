import { Capacitor } from "@capacitor/core";
import type { Platform, PushNotifications } from "../types";
import { pathOf } from "./device";

/** App push through Capacitor (APNs on iOS, Firebase on Android): permission, device token, and taps that open a screen. */
export const appPush: PushNotifications = {
  async register() {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const status = await PushNotifications.requestPermissions();
    if (status.receive !== "granted") return null;
    return new Promise((resolve) => {
      PushNotifications.addListener("registration", (t) => resolve({ platform: Capacitor.getPlatform() as Platform, token: t.value }));
      PushNotifications.addListener("registrationError", () => resolve(null));
      PushNotifications.register();
    });
  },
  async permission() {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const { receive } = await PushNotifications.checkPermissions();
    return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
  },
  onOpen(open) {
    import("@capacitor/push-notifications").then(({ PushNotifications }) =>
      PushNotifications.addListener("pushNotificationActionPerformed", (a) => {
        const url = a.notification.data?.url;
        if (typeof url === "string") open(pathOf(url));
      }),
    );
  },
};
