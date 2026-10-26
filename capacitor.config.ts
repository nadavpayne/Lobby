import type { CapacitorConfig } from "@capacitor/cli";

// The iOS app loads the live site (one codebase, every deploy reaches the app) and adds native features through
// plugins (src/lib/native/capacitor). Only the offline screen is bundled in the app.
const SITE = process.env.LOBBY_APP_URL ?? "https://lobby-mocha.vercel.app";

const config: CapacitorConfig = {
  // Change before the first App Store upload if the Apple Developer account uses another bundle id; it must match
  // APPLE_BUNDLE_ID on the server (universal links).
  appId: "il.lobby.app",
  appName: "לובי",
  webDir: "native/www",
  server: {
    // The app starts at /start, which routes each account to its own area (resident app, business, register).
    url: `${SITE}/start`,
    // Shown by the app itself when the site can't load (offline): never a browser error page.
    errorPath: "offline.html",
  },
  ios: {
    contentInset: "never", // the pages handle the notch and home indicator (safe-area insets)
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: "#14254A", showSpinner: false },
    PushNotifications: { presentationOptions: ["alert", "sound", "badge"] },
  },
};

export default config;
