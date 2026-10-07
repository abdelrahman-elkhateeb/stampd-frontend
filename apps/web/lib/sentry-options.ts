import type { BrowserOptions } from "@sentry/nextjs"

import { clientEnv } from "./env/client"

/**
 * Shared Sentry options for browser and server.
 * HR data and session cookies must never leave the app, so collection is opt-in:
 * no cookies, bodies, query strings or user fields; only the request ID header.
 */
export function sentryOptions(dsn: string): BrowserOptions {
  return {
    dsn,
    environment: clientEnv.NEXT_PUBLIC_APP_ENV,
    tracesSampleRate: clientEnv.NEXT_PUBLIC_APP_ENV === "production" ? 0.1 : 1,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: { allow: ["x-request-id"] },
        response: { allow: ["x-request-id"] },
      },
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    },
  }
}
