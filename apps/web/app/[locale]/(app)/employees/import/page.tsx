import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

import { ImportWizard } from "@/features/employees/import-wizard"
import type { Locale } from "@/i18n/routing"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("employees.import")
  return { title: t("title") }
}

export default async function Page({
  params,
}: PageProps<"/[locale]/employees/import">) {
  setRequestLocale((await params).locale as Locale)
  return <ImportWizard />
}
