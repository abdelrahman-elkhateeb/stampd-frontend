import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { getRequestTypes } from "@/features/requests/request-data"
import { RequestTypesPage } from "@/features/settings/request-types"
import { getCompanySettings } from "@/features/settings/settings-data"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.requestTypes") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/settings/request-types">) {
  setRequestLocale((await params).locale as Locale)
  const [types, settings] = await Promise.all([
    getRequestTypes(),
    getCompanySettings(),
  ])
  return (
    <RequestTypesPage
      // Leave is set up under Leave types, not switched off here.
      types={types.filter((type) => type.key !== "LEAVE")}
      disabled={settings.disabledRequestTypes}
    />
  )
}
