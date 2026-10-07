import { clientEnv } from "@/lib/env/client"

// Paths (without the locale prefix) that work without a session.
const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/invite",
  "/forgot-password",
  "/reset-password",
  "/dev/gallery",
]

function matches(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => matches(pathname, path))
}

/** Dev tools (gallery, API check) are on locally and on previews, never in production. */
export function isDevOnlyPath(pathname: string) {
  return matches(pathname, "/dev")
}

export function devRoutesEnabled() {
  return clientEnv.NEXT_PUBLIC_APP_ENV !== "production"
}
