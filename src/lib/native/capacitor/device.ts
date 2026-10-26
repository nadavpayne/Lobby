// iOS app: screen, haptics, scanner and links through Capacitor plugins (loaded on demand, never in the browser bundle path).
import type { AppLinks, Haptics, QrScanner, Screen } from "../types";

/** "https://lobby-mocha.vercel.app/i/abc?x=1" (or "/i/abc") → "/i/abc?x=1". */
export function pathOf(url: string): string {
  try {
    const u = new URL(url, "https://app.invalid");
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return "/";
  }
}

export const appScreen: Screen = {
  async keepAwake() {
    const { KeepAwake } = await import("@capacitor-community/keep-awake");
    await KeepAwake.keepAwake();
    return () => KeepAwake.allowSleep();
  },
  async maxBrightness() {
    const { ScreenBrightness } = await import("@capacitor-community/screen-brightness");
    const { brightness } = await ScreenBrightness.getBrightness();
    await ScreenBrightness.setBrightness({ brightness: 1 });
    return () => ScreenBrightness.setBrightness({ brightness });
  },
};

export const appHaptics: Haptics = {
  async success() {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  },
  async error() {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Error });
  },
};

/** Native full-screen camera scanner (with its own flashlight button); null when the user cancels. */
export const appQrScanner: QrScanner = {
  async scan() {
    const { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint, CapacitorBarcodeScannerCameraDirection } = await import("@capacitor/barcode-scanner");
    try {
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: "כוונו את המצלמה לקוד ה-QR של הדייר",
        scanButton: false,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
      });
      return result.ScanResult || null;
    } catch {
      return null; // cancelled, or no camera permission
    }
  },
};

export const appLinks: AppLinks = {
  onOpen(open) {
    import("@capacitor/app").then(({ App }) => App.addListener("appUrlOpen", (e) => open(pathOf(e.url))));
  },
};
