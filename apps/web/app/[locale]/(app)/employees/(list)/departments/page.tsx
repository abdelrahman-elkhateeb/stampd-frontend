import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { DepartmentsPage } from "@/features/employees/departments"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("employees")
  return { title: t("tabs.departments") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/employees/departments">) {
  setRequestLocale((await params).locale as Locale)
  return <DepartmentsPage />
}
