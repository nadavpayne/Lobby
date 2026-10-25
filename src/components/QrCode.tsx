"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** QR image of a value (the signed redemption token), drawn as inline SVG in brand navy. */
export function QrCode({ value, size = 200, label = "קוד QR למימוש ההטבה" }: { value: string; size?: number; label?: string }) {
  const [svg, setSvg] = useState<string>();

  useEffect(() => {
    QRCode.toString(value, { type: "svg", margin: 1, color: { dark: "#14254A", light: "#FFFFFF" } }).then(setSvg);
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: size, height: size }}
      className="[&>svg]:size-full"
      // Generated locally by the qrcode library from our own token string.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
