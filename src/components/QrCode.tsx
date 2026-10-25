"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** QR image of a short value (the redemption code), drawn as inline SVG in brand navy. */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState<string>();

  useEffect(() => {
    QRCode.toString(value, { type: "svg", margin: 1, color: { dark: "#1F3A5F", light: "#FFFFFF" } }).then(setSvg);
  }, [value]);

  return (
    <div
      role="img"
      aria-label={`קוד QR של ${value}`}
      style={{ width: size, height: size }}
      className="[&>svg]:size-full"
      // Generated locally by the qrcode library from our own code string.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
