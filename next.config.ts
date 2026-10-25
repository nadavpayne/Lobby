import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // npm run dev:lobby-dev uses its own folder, so it can run next to the normal dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  cacheComponents: true,
  partialPrefetching: true,
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
