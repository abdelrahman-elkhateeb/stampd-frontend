import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

import { REQUEST_ID_HEADER } from "@/lib/api/errors"
import { newRequestId } from "@/lib/api/request-id"
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  REFRESH_COOKIE,
  writeSessionCookies,
} from "@/lib/auth/cookies"
import { refreshTokens } from "@/lib/auth/refresh"
import { serverEnv } from "@/lib/env/server"

/**
 * The BFF proxy: the browser calls /api/<path>, we call the backend's /<path> with
 * the session's access token. Tokens stay in httpOnly cookies on this origin.
 */
async function forward(
  request: NextRequest,
  { params }: RouteContext<"/api/[...path]">
) {
  const { path } = await params
  const backendPath = `/${path.join("/")}`

  // Auth endpoints return tokens in their body; only Server Actions may call them.
  if (backendPath.startsWith("/auth/")) {
    return NextResponse.json(
      { code: "NOT_FOUND", message: "Not found" },
      { status: 404 }
    )
  }

  const cookieStore = await cookies()
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? newRequestId()
  const body = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer()

  const send = (accessToken: string | undefined) => {
    const headers = new Headers({
      [REQUEST_ID_HEADER]: requestId,
      accept: "application/json",
    })
    const contentType = request.headers.get("content-type")
    if (contentType) headers.set("content-type", contentType)
    const acceptLanguage = request.headers.get("accept-language")
    if (acceptLanguage) headers.set("accept-language", acceptLanguage)
    if (accessToken) headers.set("authorization", `Bearer ${accessToken}`)

    const url = new URL(backendPath, serverEnv.API_BASE_URL)
    url.search = request.nextUrl.search
    return fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    })
  }

  let upstream: Response
  try {
    upstream = await send(cookieStore.get(ACCESS_COOKIE)?.value)

    // Access token expired or revoked: refresh once and replay the call.
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
    if (upstream.status === 401 && refreshToken) {
      const tokens = await refreshTokens(refreshToken)
      if (tokens) {
        writeSessionCookies(cookieStore, tokens)
        upstream = await send(tokens.accessToken)
      } else {
        clearSessionCookies(cookieStore)
      }
    }
  } catch {
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "Upstream unavailable" },
      { status: 502, headers: { [REQUEST_ID_HEADER]: requestId } }
    )
  }

  const headers = new Headers({
    [REQUEST_ID_HEADER]: upstream.headers.get(REQUEST_ID_HEADER) ?? requestId,
    "cache-control": "no-store",
  })
  const contentType = upstream.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  const disposition = upstream.headers.get("content-disposition")
  if (disposition) headers.set("content-disposition", disposition)

  return new Response(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers,
  })
}

export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
}
