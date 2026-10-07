import type { AuthTokens } from "@/api/generated/model"

export const ACCESS_COOKIE = "stampd_at"
export const REFRESH_COOKIE = "stampd_rt"

// Refresh a little before the API rejects the token.
const EXPIRY_SKEW_SECONDS = 30
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

type CookieWriter = {
  set(name: string, value: string, options: Record<string, unknown>): unknown
  delete(name: string): unknown
}

function baseOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  }
}

/**
 * Stores the token pair in httpOnly cookies. The access cookie expires just before the
 * token does, so a missing access cookie with a present refresh cookie means "refresh now".
 * Works with both `cookies()` (actions, route handlers) and `response.cookies` (proxy).
 */
export function writeSessionCookies(cookies: CookieWriter, tokens: AuthTokens) {
  cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseOptions(),
    maxAge: Math.max(tokens.expiresIn - EXPIRY_SKEW_SECONDS, 1),
  })
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseOptions(),
    maxAge: REFRESH_MAX_AGE_SECONDS,
  })
}

export function clearSessionCookies(cookies: CookieWriter) {
  cookies.delete(ACCESS_COOKIE)
  cookies.delete(REFRESH_COOKIE)
}
