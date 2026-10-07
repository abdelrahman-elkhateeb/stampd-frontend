/**
 * Only same-site paths are allowed as a post-login destination, so a crafted
 * ?returnTo=https://evil.example link can't bounce users off-site.
 */
export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return fallback
  }
  return value
}

/** Keeps the destination but in the language the user is logging in with. */
export function inLocale(
  path: string,
  locale: string,
  locales: readonly string[]
): string {
  const [, first, ...rest] = path.split("/")
  return locales.includes(first ?? "")
    ? `/${[locale, ...rest].join("/")}`
    : path
}
