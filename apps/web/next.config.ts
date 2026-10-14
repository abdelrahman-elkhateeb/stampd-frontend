import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  // Profile photos are up to 2 MB, sent as FormData (plus a little multipart overhead).
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  // Photos and logos come back as signed /files/… URLs on the API. The browser
  // never talks to the API, so the Next server passes them through.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/files/:id",
          destination: `${process.env.API_BASE_URL}/files/:id`,
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
  turbopack: {
    resolveAlias: {
      // What next-intl/plugin does for us, set by hand: the plugin loads @swc/core's
      // native addon at config time, which refuses to start on Windows profiles whose
      // AppData ACL is shared with sandbox SIDs. We don't use its message extractor.
      "next-intl/config": "./i18n/request.ts",
    },
  },
}

export default nextConfig
