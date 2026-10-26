import type { NextConfig } from "next";
import { version } from "./package.json";

const nextConfig: NextConfig = {
  // Shown in Settings, for support requests.
  env: { NEXT_PUBLIC_APP_VERSION: version },
  // npm run dev:lobby-dev uses its own folder, so it can run next to the normal dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [{ source: "/contact", destination: "/support", permanent: true }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
