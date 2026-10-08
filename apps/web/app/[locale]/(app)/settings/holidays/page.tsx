import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { HolidaysPage } from "@/features/settings/holidays"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.holidays") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/settings/holidays">) {
  setRequestLocale((await params).locale as Locale)
  return <HolidaysPage />
}
