import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Suspense } from "react"

import { HolidaysPage } from "@/features/settings/holidays"
import { getHolidays } from "@/features/settings/settings-data"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.holidays") }
}

export default async function Page({
  params,
  searchParams,
}: PageProps<"/[locale]/settings/holidays">) {
  setRequestLocale((await params).locale as Locale)
  const thisYear = new Date().getUTCFullYear()
  const asked = Number((await searchParams).year)
  const year = Math.abs(asked - thisYear) <= 1 ? asked : thisYear
  return (
    // The year lives in the URL (nuqs), which needs a Suspense boundary.
    <Suspense>
      <HolidaysPage
        holidays={await getHolidays(year)}
        year={year}
        thisYear={thisYear}
      />
    </Suspense>
  )
}
