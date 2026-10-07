import type { Locale } from "./routing"

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr"
}

/**
 * The BCP 47 tag to hand to Intl.* formatters.
 * Arabic always uses Latin digits (0–9): browsers disagree on the default
 * numbering system and calendar for "ar", so both are pinned (docs/design-system/formatting.md).
 */
export function getIntlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-u-nu-latn-ca-gregory" : "en-GB"
}
