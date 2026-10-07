import * as Sentry from "@sentry/nextjs"

export async function register() {
  // Fail at startup, not on the first request, when the environment is wrong.
  const { serverEnv } = await import("./lib/env/server")
  const { sentryOptions } = await import("./lib/sentry-options")

  if (serverEnv.SENTRY_DSN) {
    Sentry.init(sentryOptions(serverEnv.SENTRY_DSN))
  }
}

export const onRequestError = Sentry.captureRequestError
