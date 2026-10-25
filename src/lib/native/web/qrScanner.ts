import jsQR from "jsqr";
import type { QrScanner } from "../types";

// Like the native scanner plugins, the web scanner owns its full-screen UI so callers only await a string.

/** Builds the full-screen overlay: camera video plus a cancel button. */
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "סריקת קוד QR");
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:50;background:#000;display:flex;flex-direction:column;" +
    "padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";

  const video = document.createElement("video");
  video.setAttribute("playsinline", ""); // iOS: play inline, not full-screen player
  video.muted = true;
  video.style.cssText = "flex:1;min-height:0;width:100%;object-fit:cover";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "ביטול";
  cancel.style.cssText =
    "margin:16px;min-height:56px;border-radius:12px;border:0;background:#EEF1F6;color:#14254A;font:inherit;font-size:1.25rem";

  overlay.append(video, cancel);
  document.body.append(overlay);
  return { overlay, video, cancel };
}

/** Camera scanner using getUserMedia + jsQR (works in Safari, which lacks BarcodeDetector). */
export const webQrScanner: QrScanner = {
  async scan() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    const { overlay, video, cancel } = createOverlay();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    let frame = 0;

    return new Promise<string | null>((resolve) => {
      const finish = (result: string | null) => {
        cancelAnimationFrame(frame);
        stream.getTracks().forEach((t) => t.stop());
        overlay.remove();
        resolve(result);
      };

      const tick = () => {
        if (video.readyState >= video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const found = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
          if (found?.data) return finish(found.data);
        }
        frame = requestAnimationFrame(tick);
      };

      cancel.onclick = () => finish(null);
      video.srcObject = stream;
      video.play().then(tick, () => finish(null));
    });
  },
};
