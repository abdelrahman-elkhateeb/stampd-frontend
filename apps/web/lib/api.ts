import { headers, cookies } from "next/headers"
import { refresh } from "next/cache"
import { notFound } from "next/navigation"
import { getLocale } from "next-intl/server"
import { cache } from "react"

import { redirect } from "@/i18n/navigation"
import { ApiError, toApiError, type Problem } from "@/lib/api-error"
import { ACCESS_COOKIE } from "@/lib/session"
import { toUser, type MeResponse } from "@/lib/user"

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
 * A Blob body goes raw with its own type (image uploads); anything else as JSON.
 * An unreachable API is a 503 ApiError, so actions can show "try again".
 */
export async function api<T = unknown>(
  path: string,
  { body, ...init }: Omit<RequestInit, "body"> & { body?: unknown } = {}
): Promise<T> {
  const [jar, incoming] = await Promise.all([cookies(), headers()])
  const token = jar.get(ACCESS_COOKIE)?.value
  const requestId = incoming.get("x-request-id")
  const raw = body instanceof Blob
  const response = await fetch(apiUrl(path), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(body !== undefined && {
        "Content-Type": raw ? body.type : "application/json",
      }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(requestId && { "X-Request-Id": requestId }),
      ...init.headers,
    },
    body: raw ? body : body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => new Response(null, { status: 503 }))
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

/** For server actions: API errors come back as a Problem (success: undefined); redirects (401) still throw. */
export async function attempt(
  call: () => Promise<unknown>
): Promise<Problem | undefined> {
  try {
    await call()
  } catch (error) {
    if (!(error instanceof ApiError)) throw error
    return { code: error.code, fieldErrors: error.fieldErrors }
  }
}

/** A server action's write: the page re-renders on success, so it shows what the server has. */
export async function mutate(
  path: string,
  init: { method: string; body?: unknown }
) {
  const problem = await attempt(() => api(path, init))
  if (!problem) refresh()
  return problem
}

/** The signed-in user; one API call per request however many components ask. */
export const getMe = cache(async () => toUser(await api<MeResponse>("/me")))
