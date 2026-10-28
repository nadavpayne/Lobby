import type { PushMessage } from "./apns";

/** The FCM v1 message for one Android device: a visible notification, plus the path a tap opens. */
export function fcmMessage(token: string, message: PushMessage) {
  return {
    message: {
      token,
      notification: { title: message.title, body: message.body },
      data: { url: message.url },
      android: { priority: "high" as const },
    },
  };
}

/** True when FCM says the token will never work again (app uninstalled, token replaced, or not a token). */
export function isDeadToken(status: number, body: string): boolean {
  return status === 404 || /UNREGISTERED/.test(body) || (status === 400 && /registration token/i.test(body));
}
