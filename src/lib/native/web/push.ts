import type { PushNotifications } from "../types";

/** Web push is out of scope for now: the browser never registers a token. */
export const webPush: PushNotifications = {
  register: async () => null,
};
