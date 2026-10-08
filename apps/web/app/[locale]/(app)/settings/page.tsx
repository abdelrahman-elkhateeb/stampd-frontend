import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { CompanySettingsPage } from "@/features/settings/company-settings"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.company") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/settings">) {
  setRequestLocale((await params).locale as Locale)
  return <CompanySettingsPage />
}
