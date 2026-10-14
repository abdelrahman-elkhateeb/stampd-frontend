import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { LeaveForm } from "@/features/leave/leave-form"
import { getLeaveTypes } from "@/features/settings/settings-data"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("leave.form")
  return { title: t("title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/leave/new">) {
  setRequestLocale((await params).locale as Locale)
  return <LeaveForm types={await getLeaveTypes()} />
}
