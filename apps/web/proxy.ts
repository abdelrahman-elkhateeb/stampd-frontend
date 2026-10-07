import createMiddleware from "next-intl/middleware"
import { NextResponse, type NextRequest } from "next/server"

import { routing } from "@/i18n/routing"

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
  return intlMiddleware(request)
}

export const config = {
  // Everything except Next internals, Vercel internals and files with an extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
}
