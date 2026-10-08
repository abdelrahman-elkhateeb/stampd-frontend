import createMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

import { routing, type Locale } from "@/i18n/routing"
import { canAccess } from "@/lib/access"
import { DEMO_USER } from "@/lib/demo-user"

const intlMiddleware = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  // Dev tools (the gallery) are on locally and on previews, never in production.
  const [, locale, first] = request.nextUrl.pathname.split("/")
  if (first === "dev" && process.env.NEXT_PUBLIC_APP_ENV === "production") {
    // Render the catch-all route, i.e. the localised 404 page.
    return NextResponse.rewrite(
      new URL(`/${locale}/__dev-routes-disabled`, request.url)
    )
  }
  // A role without access gets the no-access page at the same URL; the page never renders.
  // ponytail: role from the demo user; read it from the session once BE-03 exists.
  const rest = request.nextUrl.pathname.slice(locale!.length + 1) || "/"
  if (
    routing.locales.includes(locale as Locale) &&
    !canAccess(DEMO_USER.role, rest)
  ) {
    return NextResponse.rewrite(new URL(`/${locale}/no-access`, request.url))
  }
  return intlMiddleware(request)
}

export const config = {
  // Everything except Next internals, Vercel internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
