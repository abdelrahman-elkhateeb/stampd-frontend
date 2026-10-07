import { z } from "zod"

const appEnv = z.enum(["local", "preview", "staging", "production"])

// Only read on the server (Server Components, Route Handlers, Server Actions, proxy).
export const serverEnvSchema = z.object({
  API_BASE_URL: z.url(),
  SENTRY_DSN: z.url().optional(),
  // True when API_BASE_URL points at the local mock API (pnpm mock).
  API_MOCKING: z.stringbool().default(false),
})

// Inlined into the browser bundle at build time. Never put secrets here.
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_ENV: appEnv.default("local"),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Empty strings in .env files mean "not set".
function withoutEmpty(source: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== "")
  )
}

function parse<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined>,
  label: string
): z.infer<T> {
  const result = schema.safeParse(withoutEmpty(source))
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    throw new Error(
      `Invalid ${label} environment variables:\n${problems}\nSee apps/web/.env.example.`
    )
  }
  return result.data
}

export function parseServerEnv(
  source: Record<string, string | undefined>
): ServerEnv {
  return parse(serverEnvSchema, source, "server")
}

export function parseClientEnv(
  source: Record<string, string | undefined>
): ClientEnv {
  return parse(clientEnvSchema, source, "client")
}
