import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { EmployeeDetail } from "@/features/employees/employee-detail"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("employees")
  return { title: t("detail.title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/employees/[id]">) {
  const { locale, id } = await params
  setRequestLocale(locale as Locale)
  return <EmployeeDetail id={id} />
}
