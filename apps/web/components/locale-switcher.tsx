"use client"

import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { Link, usePathname } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { cn } from "@workspace/ui/lib/utils"

export function LocaleSwitcher({ className }: { className?: string }) {
  // Static pages render without the query string; the links pick it up after hydration.
  return (
    <Suspense fallback={<LocaleLinks className={className} />}>
      <LocaleLinksWithQuery className={className} />
    </Suspense>
  )
}

function LocaleLinksWithQuery({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  return (
    <LocaleLinks
      className={className}
      query={Object.fromEntries(searchParams.entries())}
    />
  )
}

function LocaleLinks({
  className,
  query,
}: {
  className?: string
  query?: Record<string, string>
}) {
  const t = useTranslations("locale")
  const current = useLocale()
  const pathname = usePathname()

  return (
    <nav
      aria-label={t("label")}
      className={cn("flex w-fit gap-0.5 rounded-pill bg-muted p-0.5", className)}
    >
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={{ pathname, query }}
          locale={locale}
          // Each language names itself, so the label is read with the right voice.
          lang={locale}
          aria-current={locale === current ? "true" : undefined}
          className="rounded-pill px-3 py-1 text-body-sm font-medium text-subtle-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-[current=true]:bg-inverse aria-[current=true]:font-bold aria-[current=true]:text-inverse-foreground"
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  )
}
