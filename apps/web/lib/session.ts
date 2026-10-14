import { cookies } from "next/headers"

// The browser never sees the tokens: the Next server keeps them in httpOnly
// cookies and sends them to the API as a Bearer header (Next.js as BFF).
export const ACCESS_COOKIE = "stampd_access"
export const REFRESH_COOKIE = "stampd_refresh"

// Refresh tokens live 30 days and rotate on every POST /auth/refresh.
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60

export type Tokens = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/** Name, value and options for each cookie: works with cookies() and NextResponse.cookies. */
export function sessionCookies(tokens: Tokens) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  } as const
  return [
    [
      ACCESS_COOKIE,
      tokens.accessToken,
      { ...options, maxAge: tokens.expiresIn },
    ],
    [
      REFRESH_COOKIE,
      tokens.refreshToken,
      { ...options, maxAge: REFRESH_MAX_AGE },
    ],
  ] as const
}

/** In a server action or route handler (server components can't set cookies). */
export async function saveSession(tokens: Tokens) {
  const jar = await cookies()
  for (const [name, value, options] of sessionCookies(tokens))
    jar.set(name, value, options)
}

export async function clearSession() {
  const jar = await cookies()
  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
}

/**
 * Seconds left on an access token, read from the JWT's `exp`. No signature
 * check: the API verifies every request; this only decides when to refresh.
 */
export function secondsLeft(token: string | undefined, now = Date.now()) {
  try {
    const payload = JSON.parse(
      Buffer.from(token!.split(".")[1]!, "base64url").toString()
    ) as { exp?: unknown }
    return typeof payload.exp === "number" ? payload.exp - now / 1000 : 0
  } catch {
    return 0
  }
}
