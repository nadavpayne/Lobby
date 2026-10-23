import type { Share } from "../types";

/** Web Share API, falling back to copying the link/text to the clipboard. */
export const webShare: Share = {
  async share(content) {
    if (navigator.share) {
      try {
        await navigator.share(content);
        return "shared";
      } catch {
        return "cancelled"; // AbortError when the user closes the sheet
      }
    }
    await navigator.clipboard.writeText(content.url ?? content.text ?? "");
    return "copied";
  },
};
