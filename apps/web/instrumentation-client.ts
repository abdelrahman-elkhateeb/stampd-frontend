import * as Sentry from "@sentry/nextjs"

import { clientEnv } from "./lib/env/client"
import { sentryOptions } from "./lib/sentry-options"

if (clientEnv.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init(sentryOptions(clientEnv.NEXT_PUBLIC_SENTRY_DSN))
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
