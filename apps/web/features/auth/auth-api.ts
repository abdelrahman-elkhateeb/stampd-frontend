import { headers } from "next/headers"

import { apiUrl } from "@/lib/api"
import { toApiError } from "@/lib/api-error"

/**
 * POSTs to a public /auth endpoint. Not api(): there a 401 means "session gone,
 * go to login", but here it's a wrong password the form has to show.
 * An unreachable API comes back as a 503, so forms say "try again" instead of crashing.
 */
export async function authPost(path: string, body: unknown) {
  const url = apiUrl(path)
  const incoming = await headers()
  const requestId = incoming.get("x-request-id")
  // The API rate-limits logins per client IP; without this, everyone shares the Next server's.
  const forwardedFor = incoming.get("x-forwarded-for")
  try {
    return await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(requestId && { "X-Request-Id": requestId }),
        ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
      },
      body: JSON.stringify(body),
    })
  } catch {
    return new Response(null, { status: 503 })
  }
}

/** A used, unknown (404) or expired (410) link: the page shows the expired state. */
const isDeadLink = (response: Response) =>
  response.status === 404 || response.status === 410

export async function findInvite(token: string) {
  const response = await authPost("/auth/invitations/verify", { token })
  if (isDeadLink(response)) return null
  if (!response.ok) throw await toApiError(response)
  return (await response.json()) as {
    companyName: string
    name: string
    email: string
  }
}

export async function isResetTokenValid(token: string) {
  const response = await authPost("/auth/password/reset/verify", { token })
  if (isDeadLink(response)) return false
  if (!response.ok) throw await toApiError(response)
  return true
}

/** Only same-site paths, so a crafted link can't send people elsewhere after login. */
export function safeReturnTo(value: string | string[] | undefined) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/"
}
