import type { PushNotifications } from "../types";

/** Web push is out of scope: notifications are an iOS app feature. */
export const webPush: PushNotifications = {
  register: async () => null,
  permission: async () => "unsupported",
  onOpen: () => {},
};
