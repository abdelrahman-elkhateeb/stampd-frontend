import createMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

import { routing, type Locale } from "@/i18n/routing"
import { matchesPath, rolesFor } from "@/lib/access"
import { apiUrl } from "@/lib/api"
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  secondsLeft,
  sessionCookies,
  type Tokens,
} from "@/lib/session"
import { toRole, type MeResponse } from "@/lib/user"

const intlMiddleware = createMiddleware(routing)

// Open without a session. Everything else sends signed-out visitors to login.
const PUBLIC = [
  "/login",
  "/signup",
  "/invite",
  "/forgot-password",
  "/reset-password",
  "/dev",
]
// A signed-in user has no business here; they go home.
const GUEST_ONLY = ["/login", "/signup"]

// Refresh a bit early, so the token can't expire between here and the API call.
const REFRESH_MARGIN = 60

/** New tokens; null when the API ended the session, undefined when it didn't answer. */
async function refresh(
  refreshToken: string
): Promise<Tokens | null | undefined> {
  const response = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => undefined)
  if (!response || response.status >= 500) return undefined
  return response.ok ? ((await response.json()) as Tokens) : null
}

/**
 * The JWT carries no role, so restricted routes ask the API. undefined (API down)
 * lets the page through: every API call checks the role again.
 */
async function roleOf(accessToken: string) {
  const response = await fetch(apiUrl("/me"), {
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => undefined)
  if (response?.ok) return toRole(((await response.json()) as MeResponse).role)
}

export default async function proxy(request: NextRequest) {
  // Dev tools (the gallery) are on locally and on previews, never in production.
  const [, locale, first] = request.nextUrl.pathname.split("/")
  if (first === "dev" && process.env.NEXT_PUBLIC_APP_ENV === "production") {
    // Render the catch-all route, i.e. the localised 404 page.
    return NextResponse.rewrite(
      new URL(`/${locale}/__dev-routes-disabled`, request.url)
    )
  }
  // No locale yet: next-intl redirects to /en/… and the next request lands below.
  if (!routing.locales.includes(locale as Locale))
    return intlMiddleware(request)

  const path = request.nextUrl.pathname.slice(locale!.length + 1) || "/"
  // api() sends a 401 back to login with this as returnTo.
  request.headers.set("x-pathname", path + request.nextUrl.search)

  // Keep the access token fresh. New cookies go on the request too, so this render uses them.
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  const tokens =
    refreshToken && secondsLeft(accessToken) < REFRESH_MARGIN
      ? await refresh(refreshToken)
      : undefined
  if (tokens) {
    for (const [name, value] of sessionCookies(tokens))
      request.cookies.set(name, value)
    accessToken = tokens.accessToken
  } else if (tokens === null) {
    request.cookies.delete([ACCESS_COOKIE, REFRESH_COOKIE])
    accessToken = undefined
  }
  const signedIn = secondsLeft(accessToken) > 0

  const response = await route()
  if (tokens)
    for (const [name, value, options] of sessionCookies(tokens))
      response.cookies.set(name, value, options)
  else if (tokens === null) {
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
  }
  return response

  async function route() {
    const goTo = (href: string) => new URL(`/${locale}${href}`, request.url)
    const isPublic = PUBLIC.some((href) => matchesPath(path, href))
    if (!signedIn && !isPublic) {
      const login = goTo("/login")
      login.searchParams.set("returnTo", path + request.nextUrl.search)
      return NextResponse.redirect(login)
    }
    if (signedIn && GUEST_ONLY.some((href) => matchesPath(path, href)))
      return NextResponse.redirect(goTo("/"))

    // A role without access gets the no-access page at the same URL; the page never renders.
    const roles = rolesFor(path)
    if (signedIn && roles) {
      const role = await roleOf(accessToken!)
      if (role && !roles.includes(role))
        return NextResponse.rewrite(goTo("/no-access"), {
          request: { headers: request.headers },
        })
    }
    return intlMiddleware(request)
  }
}

export const config = {
  // Everything except Next internals, Vercel internals, API files and files with an extension.
  matcher: "/((?!api|_next|_vercel|files/|.*\\..*).*)",
}
