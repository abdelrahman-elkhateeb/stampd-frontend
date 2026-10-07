import { withSentryConfig } from "@sentry/nextjs/config"
import type { NextConfig } from "next"

import { parseClientEnv, parseServerEnv } from "./lib/env/schema"

// `next dev` and `next build` stop here with a readable message if the environment is wrong.
parseServerEnv(process.env)
parseClientEnv(process.env)

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  experimental: {
    // Enables forbidden() + app/[locale]/forbidden.tsx for the 403 page.
    authInterrupts: true,
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Source maps upload only when CI provides a token.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  // Send browser events through our own domain so ad blockers don't drop them.
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  telemetry: false,
})
