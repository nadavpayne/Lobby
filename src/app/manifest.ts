import type { MetadataRoute } from "next";

/** PWA manifest: residents open Lobby from a WhatsApp link and can add it to their home screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "לובי — מועדון הטבות לבניין",
    short_name: "לובי",
    lang: "he",
    dir: "rtl",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F1EA",
    theme_color: "#1F3A5F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
