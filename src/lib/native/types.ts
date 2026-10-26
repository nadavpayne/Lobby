// Platform-neutral interfaces for device features. UI code depends only on these;
// web implementations live in ./web, the iOS app (Capacitor) ones in ./capacitor.

export type Platform = "ios" | "android" | "web";

export interface PushRegistration {
  platform: Platform;
  token: string;
}

export interface PushNotifications {
  /** Asks permission and returns a push token, or null if unsupported or denied. */
  register(): Promise<PushRegistration | null>;
  /** "granted" | "denied" | "prompt" (not asked yet) | "unsupported". */
  permission(): Promise<"granted" | "denied" | "prompt" | "unsupported">;
  /** Calls back with the in-app path to open when the user taps a notification. */
  onOpen(open: (path: string) => void): void;
}

export interface Screen {
  /** Keeps the screen on (QR shown at the register); call the returned function to allow sleep again. */
  keepAwake(): Promise<() => Promise<void>>;
  /** Raises brightness to the maximum; call the returned function to restore the previous level. */
  maxBrightness(): Promise<() => Promise<void>>;
}

export interface Haptics {
  success(): Promise<void>;
  error(): Promise<void>;
}

export interface AppLinks {
  /** Calls back with the in-app path when a universal link (e.g. a building invite from WhatsApp) opens the app. */
  onOpen(open: (path: string) => void): void;
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
  /** True inside the iOS app (Capacitor), false in a browser. */
  isApp: boolean;
  push: PushNotifications;
  geolocation: Geolocation;
  qrScanner: QrScanner;
  share: Share;
  screen: Screen;
  haptics: Haptics;
  links: AppLinks;
}
