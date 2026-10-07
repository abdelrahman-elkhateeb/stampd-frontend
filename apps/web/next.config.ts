import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
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
