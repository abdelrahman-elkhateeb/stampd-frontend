import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"

import { routing } from "@/i18n/routing"
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  REFRESH_COOKIE,
  writeSessionCookies,
} from "@/lib/auth/cookies"
import { PATHNAME_HEADER } from "@/lib/auth/headers"
import { refreshTokens } from "@/lib/auth/refresh"
import {
  devRoutesEnabled,
  isDevOnlyPath,
  isPublicPath,
} from "@/lib/auth/routes"

const intlMiddleware = createMiddleware(routing)

function splitLocale(pathname: string) {
  const [, first, ...rest] = pathname.split("/")
  const locale = routing.locales.find((candidate) => candidate === first)
  return locale ? { locale, path: `/${rest.join("/")}` } : null
}

function loginRedirect(
  request: NextRequest,
  locale: string,
  reason?: "expired"
) {
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}/login`
  url.search = ""
  url.searchParams.set(
    "returnTo",
    request.nextUrl.pathname + request.nextUrl.search
  )
  if (reason) url.searchParams.set("reason", reason)
  return NextResponse.redirect(url)
}

/** Rewrites the Cookie header so this same request already sees the refreshed tokens. */
function withCookies(headers: Headers, values: Record<string, string>) {
  const cookies = new Map(
    (headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=")
        return [part.slice(0, index), part.slice(index + 1)] as const
      })
  )
  for (const [name, value] of Object.entries(values)) cookies.set(name, value)
  headers.set(
    "cookie",
    [...cookies].map(([name, value]) => `${name}=${value}`).join("; ")
  )
}

export default async function proxy(request: NextRequest) {
  const parts = splitLocale(request.nextUrl.pathname)
  // No locale in the URL yet: next-intl redirects to /en or /ar first.
  if (!parts) {
    return intlMiddleware(request)
  }

  const { locale, path } = parts
  if (isDevOnlyPath(path) && !devRoutesEnabled()) {
    // Render the catch-all route, i.e. the localised 404 page.
    return NextResponse.rewrite(
      new URL(`/${locale}/__dev-routes-disabled`, request.url)
    )
  }

  const headers = new Headers(request.headers)
  headers.set(
    PATHNAME_HEADER,
    request.nextUrl.pathname + request.nextUrl.search
  )

  let refreshed: Awaited<ReturnType<typeof refreshTokens>> = null
  if (!isPublicPath(path)) {
    const hasAccess = request.cookies.has(ACCESS_COOKIE)
    const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value

    if (!hasAccess && !refreshToken) {
      return loginRedirect(request, locale)
    }
    if (!hasAccess && refreshToken) {
      refreshed = await refreshTokens(refreshToken)
      if (!refreshed) {
        const response = loginRedirect(request, locale, "expired")
        clearSessionCookies(response.cookies)
        return response
      }
      withCookies(headers, {
        [ACCESS_COOKIE]: refreshed.accessToken,
        [REFRESH_COOKIE]: refreshed.refreshToken,
      })
    }
  }

  // next-intl copies these request headers onto the request the page renders with.
  const response = intlMiddleware(new NextRequest(request, { headers }))
  if (refreshed) {
    writeSessionCookies(response.cookies, refreshed)
  }
  return response
}

export const config = {
  // Everything except API routes, Next internals, Vercel internals, the Sentry tunnel
  // and files with an extension.
  matcher: "/((?!api|_next|_vercel|monitoring|.*\\..*).*)",
}
