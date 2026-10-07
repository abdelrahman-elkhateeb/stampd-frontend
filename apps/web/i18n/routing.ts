import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
  // Every URL carries its locale (/en/…, /ar/…) so links keep the language.
  localePrefix: "always",
  // First visit: Accept-Language decides; after that the cookie remembers the choice.
  localeCookie: {
    maxAge: 60 * 60 * 24 * 365,
  },
})

export type Locale = (typeof routing.locales)[number]
