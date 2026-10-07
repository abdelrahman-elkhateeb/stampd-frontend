import "server-only"

import * as Sentry from "@sentry/nextjs"
import { cookies, headers } from "next/headers"
import { forbidden, redirect } from "next/navigation"
import { getLocale } from "next-intl/server"

import { ACCESS_COOKIE } from "@/lib/auth/cookies"
import { PATHNAME_HEADER } from "@/lib/auth/headers"
import { serverEnv } from "@/lib/env/server"

import {
  ApiError,
  apiErrorFromResponse,
  isReportable,
  networkError,
  REQUEST_ID_HEADER,
} from "./errors"
import { newRequestId } from "./request-id"

type ServerFetchInit = RequestInit & {
  /**
   * "handle" (default): 401 → login with a return URL, 403 → the "no access" page.
   * "throw": surface them as ApiError (e.g. a Server Action that maps them itself).
   */
  authErrors?: "handle" | "throw"
}

/**
 * Orval mutator for server code (Server Components, Server Actions, Route Handlers).
 * Calls the backend directly with the session's access token.
 */
export async function serverFetch<T>(
  url: string,
  init: ServerFetchInit = {}
): Promise<T> {
  const { authErrors = "handle", ...requestInit } = init
  const requestId = newRequestId()
  const requestHeaders = new Headers(requestInit.headers)
  requestHeaders.set(REQUEST_ID_HEADER, requestId)

  const accessToken = (await cookies()).get(ACCESS_COOKIE)?.value
  if (accessToken) {
    requestHeaders.set("authorization", `Bearer ${accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(new URL(url, serverEnv.API_BASE_URL), {
      cache: "no-store",
      ...requestInit,
      headers: requestHeaders,
    })
  } catch (cause) {
    const error = networkError(cause, requestId)
    Sentry.captureException(error, { tags: { request_id: requestId } })
    throw error
  }

  if (response.ok) {
    return (response.status === 204 ? undefined : await response.json()) as T
  }

  const error = await apiErrorFromResponse(response)
  if (isReportable(error)) {
    Sentry.captureException(error, {
      tags: { request_id: error.requestId ?? requestId },
    })
  }
  if (authErrors === "handle") {
    await handleAuthError(error)
  }
  throw error
}

async function handleAuthError(error: ApiError) {
  if (error.status === 403) {
    forbidden()
  }
  if (error.status === 401) {
    const locale = await getLocale()
    const returnTo = (await headers()).get(PATHNAME_HEADER) ?? `/${locale}`
    const params = new URLSearchParams({ returnTo, reason: "expired" })
    redirect(`/${locale}/login?${params}`)
  }
}
