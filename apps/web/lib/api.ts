import { headers, cookies } from "next/headers"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"

import { redirect } from "@/i18n/navigation"
import { toApiError } from "@/lib/api-error"
import { ACCESS_COOKIE } from "@/lib/session"

export function apiUrl(path: string) {
  const base = process.env.API_BASE_URL
  if (!base) throw new Error("API_BASE_URL is not set (see .env.example)")
  return new URL(path, base).toString()
}

/**
 * Calls the API as the signed-in user. Server only: reads the token cookie.
 * proxy.ts keeps the access token fresh, so a 401 here means the session is gone.
 *
 * GETs are page reads: 404 → not-found page, 403 → no-access page.
 * Anything else throws ApiError for the caller (forms map `fieldErrors`).
 */
export async function api<T = unknown>(
  path: string,
  { body, ...init }: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const [jar, incoming] = await Promise.all([cookies(), headers()])
  const token = jar.get(ACCESS_COOKIE)?.value
  const requestId = incoming.get("x-request-id")
  const response = await fetch(apiUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(requestId && { "X-Request-Id": requestId }),
      ...init.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (response.ok)
    return (response.status === 204 ? undefined : await response.json()) as T

  const locale = await getLocale()
  if (response.status === 401) {
    const returnTo = incoming.get("x-pathname") ?? "/"
    redirect({ href: { pathname: "/login", query: { returnTo } }, locale })
  }
  const isRead = !init.method || init.method === "GET"
  if (isRead && response.status === 404) notFound()
  if (isRead && response.status === 403)
    redirect({ href: "/no-access", locale })
  throw await toApiError(response)
}
