import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { CompanySettingsPage } from "@/features/settings/company-settings"
import {
  getCompanySettings,
  getSettingsHistory,
} from "@/features/settings/settings-data"
import type { Locale } from "@/i18n/routing"
import { getMe } from "@/lib/api"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.company") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/settings">) {
  setRequestLocale((await params).locale as Locale)
  const me = await getMe()
  const [settings, history] = await Promise.all([
    getCompanySettings(),
    getSettingsHistory(me.company.id),
  ])
  return <CompanySettingsPage settings={settings} history={history} />
}
