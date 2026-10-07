import type { AuthTokens } from "@/api/generated/model"
import { parseServerEnv } from "@/lib/env/schema"

// The refresh token rotates on every use and the API revokes the whole family when an
// old one is replayed. Parallel requests that all see an expired access token must
// therefore share ONE refresh call; the result is kept briefly for late arrivals.
const SHARE_WINDOW_MS = 10_000
const inflight = new Map<
  string,
  { promise: Promise<AuthTokens | null>; createdAt: number }
>()

async function callRefresh(refreshToken: string): Promise<AuthTokens | null> {
  const { API_BASE_URL } = parseServerEnv(process.env)
  try {
    const response = await fetch(new URL("/auth/refresh", API_BASE_URL), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": crypto.randomUUID(),
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    })
    if (!response.ok) {
      return null
    }
    return (await response.json()) as AuthTokens
  } catch {
    return null
  }
}

/** Exchanges a refresh token for a new pair. Resolves null when the session is over. */
export function refreshTokens(
  refreshToken: string
): Promise<AuthTokens | null> {
  const now = Date.now()
  for (const [key, entry] of inflight) {
    if (now - entry.createdAt > SHARE_WINDOW_MS) inflight.delete(key)
  }

  const existing = inflight.get(refreshToken)
  if (existing) {
    return existing.promise
  }
  const promise = callRefresh(refreshToken)
  inflight.set(refreshToken, { promise, createdAt: now })
  return promise
}
