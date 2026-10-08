import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { RequestTypesPage } from "@/features/settings/request-types"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.requestTypes") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/settings/request-types">) {
  setRequestLocale((await params).locale as Locale)
  return <RequestTypesPage />
}
