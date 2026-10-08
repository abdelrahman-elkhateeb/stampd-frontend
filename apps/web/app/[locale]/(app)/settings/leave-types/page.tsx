import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LeaveTypesPage } from "@/features/settings/leave-types"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings")
  return { title: t("tabs.leaveTypes") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/settings/leave-types">) {
  setRequestLocale((await params).locale as Locale)
  return <LeaveTypesPage />
}
