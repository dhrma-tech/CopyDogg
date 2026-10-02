import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-tools indicator badge is framework chrome, not app content.
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Nobody else's page gets to frame this one, except the CopyDogg
          // extension's side panel (extension/). Its ID is pinned by the
          // "key" in extension/manifest.json. No X-Frame-Options: it can't
          // name an allowed framer, and frame-ancestors overrides it anyway.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors chrome-extension://ipialiimnonkhligihpjlbnejmjcklie",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
