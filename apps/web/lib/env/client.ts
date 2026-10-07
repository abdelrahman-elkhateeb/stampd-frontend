import { parseClientEnv } from "./schema"

// Each variable is referenced by its full name so Next.js can inline it at build time.
export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
})
