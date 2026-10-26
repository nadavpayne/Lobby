import type { AppLinks, Haptics, Screen } from "../types";

const nothing = async () => {};

/** Browser: keeps the screen on with the Wake Lock API where supported; brightness can't be changed from a web page. */
export const webScreen: Screen = {
  async keepAwake() {
    const lock = await navigator.wakeLock?.request("screen").catch(() => null);
    return async () => {
      await lock?.release().catch(() => {});
    };
  },
  maxBrightness: async () => nothing,
};

/** Browsers on iPhone have no vibration API: no-ops. */
export const webHaptics: Haptics = { success: nothing, error: nothing };

/** In a browser, links simply load pages. */
export const webLinks: AppLinks = { onOpen: () => {} };
