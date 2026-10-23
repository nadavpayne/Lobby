// Platform-neutral interfaces for device features. UI code depends only on these;
// web implementations live in ./web, Capacitor implementations will be added alongside later.

export type Platform = "ios" | "android" | "web";

export interface PushRegistration {
  platform: Platform;
  token: string;
}

export interface PushNotifications {
  /** Asks permission and returns a push token, or null if unsupported or denied. */
  register(): Promise<PushRegistration | null>;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Geolocation {
  /** Returns the current position, or null if unavailable or denied. */
  getCurrentPosition(): Promise<Coordinates | null>;
}

export interface QrScanner {
  /** Opens a full-screen camera scanner; resolves with the decoded text, or null if the user cancelled. */
  scan(): Promise<string | null>;
}

export interface ShareContent {
  title?: string;
  text?: string;
  url?: string;
}

export interface Share {
  /** Opens the system share sheet, falling back to copying to the clipboard. */
  share(content: ShareContent): Promise<"shared" | "copied" | "cancelled">;
}

export interface Native {
  platform: Platform;
  push: PushNotifications;
  geolocation: Geolocation;
  qrScanner: QrScanner;
  share: Share;
}
