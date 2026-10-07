import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"

import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { fontVariables } from "@/lib/fonts"
import { getDirection } from "@/i18n/locale"
import { routing } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    return {}
  }
  const t = await getTranslations({ locale, namespace: "app" })
  return {
    title: { default: t("name"), template: `%s · ${t("name")}` },
    description: t("tagline"),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)
  const dir = getDirection(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={cn("antialiased", ...fontVariables)}
    >
      <body>
        <NextIntlClientProvider>
          <Providers dir={dir}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
