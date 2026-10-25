import jsQR from "jsqr";

/** A running in-page camera scan. */
export interface CameraScan {
  stop: () => void;
  /** Turns the flashlight on/off; false if this camera has none (most laptops, iOS Safari). */
  setTorch: (on: boolean) => Promise<boolean>;
  hasTorch: boolean;
}

/**
 * Plays the back camera into `video` and calls `onCode` once with the first QR it reads (getUserMedia + jsQR, so it
 * also works in Safari). Rejects if there is no camera or permission is denied.
 * shortcut: web only; the Capacitor app will plug in a native scanner behind the same register screen.
 */
export async function startCameraScan(video: HTMLVideoElement, onCode: (text: string) => void): Promise<CameraScan> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
  const [track] = stream.getVideoTracks();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  let frame = 0;
  let stopped = false;

  const stop = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  };

  const tick = () => {
    if (stopped) return;
    if (video.readyState >= video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const found = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if (found?.data) {
        stop();
        return onCode(found.data);
      }
    }
    frame = requestAnimationFrame(tick);
  };

  video.srcObject = stream;
  video.setAttribute("playsinline", "");
  video.muted = true;
  await video.play();
  tick();

  const hasTorch = "torch" in ((track.getCapabilities?.() ?? {}) as Record<string, unknown>);
  return {
    stop,
    hasTorch,
    setTorch: async (on) => {
      if (!hasTorch) return false;
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      return true;
    },
  };
}
