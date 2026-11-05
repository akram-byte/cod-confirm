import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every dashboard page is per-request owner data, so we keep classic
  // dynamic rendering instead of Cache Components (simpler, fewer gotchas).
  cacheComponents: false,
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
